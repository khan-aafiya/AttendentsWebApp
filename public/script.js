// Fixed students list
const students = ['Aafiya', 'Aliza', 'Amrpali', 'Anam', 'Bushra', 'Dnyaneshawri'];

// Global variables
let selectedStudent = null;
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || {};

// Initialize the application
function initApp() {
    const loggedInStudent = localStorage.getItem("loggedInStudent"); // 👈 auto-select ke liye
    populateStudentSelect(loggedInStudent); // pass kar rahe hain
    renderStudentList();

    if (loggedInStudent) {
        selectedStudent = loggedInStudent;
        showNotification(`Welcome back, ${selectedStudent} 👋`);
        renderWeeklyAttendance();

        // dropdown ko hide kar do agar login student mila
        document.getElementById("student-select").style.display = "none";
    }

    updateTimeDisplay();
    updateStats();
    setInterval(updateTimeDisplay, 1000);
}

// Populate student select dropdown
function populateStudentSelect(autoSelect = null) {
    const studentSelect = document.getElementById('student-select');
    studentSelect.innerHTML = '<option value="">-- Select a student --</option>';

    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student;
        option.textContent = student;

        // auto-select option if matched
        if (autoSelect && autoSelect === student) {
            option.selected = true;
        }

        studentSelect.appendChild(option);
    });

    // Add event listener for student selection
    studentSelect.addEventListener('change', function () {
        selectedStudent = this.value;
        if (selectedStudent) {
            showNotification(`Selected student: ${selectedStudent}`);
            renderWeeklyAttendance();
        }
    });
}

// Show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const title = document.getElementById('notification-title');
    const msg = document.getElementById('notification-message');

    icon.textContent = isError ? '❌' : '✅';
    title.textContent = isError ? 'Error' : 'Success';
    msg.textContent = message;

    notification.className = 'notification';
    if (isError) notification.classList.add('error');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.remove('error');
    }, 3000);
}

// Update time display
function updateTimeDisplay() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    document.getElementById('current-time').textContent =
        `Current time: ${hours}:${minutes}:${seconds}`;

    // Update today's date
    document.getElementById('today-date').textContent =
        `📅 Today: ${now.toLocaleDateString()}`;

    // Update time status message
    const timeStatus = document.getElementById('time-status');
    const timeMessage = document.getElementById('time-message');

    if (hours >= 8 && hours < 23) {
        timeStatus.classList.add('time-open');
        timeMessage.textContent = 'Attendance marking is OPEN';
    } else {
        timeStatus.classList.remove('time-open');
        timeMessage.textContent = 'Attendance marking is CLOSED';
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Render student list (left sidebar status)
function renderStudentList() {
    const studentList = document.getElementById('student-list');
    studentList.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];

    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';

        let status = 'pending';
        let statusText = 'Pending';
        let statusClass = 'status-pending';

        if (attendanceData[today] && attendanceData[today][student]) {
            status = attendanceData[today][student];
            statusText = status === 'present' ? 'Present ✅' : 'Absent ❌';
            statusClass = status === 'present' ? 'status-present' : 'status-absent';
        }

        studentItem.innerHTML = `
              <span class="student-name">${student}</span>
              <span class="${statusClass}">${statusText}</span>
          `;

        studentList.appendChild(studentItem);
    });
}

// Update statistics (present/absent today)
function updateStats() {
    const today = new Date().toISOString().split('T')[0];

    if (attendanceData[today]) {
        presentCount = Object.values(attendanceData[today]).filter(s => s === 'present').length;
        absentCount = Object.values(attendanceData[today]).filter(s => s === 'absent').length;
    }
}

// Handle day cell click
function handleDayClick(student, date) {
    if (!selectedStudent) {
        showNotification('Please select a student first', true);
        return;
    }
    if (student !== selectedStudent) {
        showNotification(`You can only mark attendance for ${selectedStudent}`, true);
        return;
    }

    // Time restriction: allow only between 8 AM and 11 PM
    const now = new Date();
    const currentHour = now.getHours();

    if (!(currentHour >= 8 && currentHour < 23)) {
        showNotification('Attendance can only be marked between 8 AM and 11 PM', true);
        return;
    }

    // Toggle attendance
    if (!attendanceData[date]) attendanceData[date] = {};

    const currentStatus = attendanceData[date][student];
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';

    attendanceData[date][student] = newStatus;
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));

    showNotification(`${student} marked as ${newStatus === 'present' ? 'Present ✅' : 'Absent ❌'} for ${formatDate(date)}`);

    renderStudentList();
    updateStats();
    renderWeeklyAttendance();
}

// Render weekly attendance (with Sunday letters per row)
function renderWeeklyAttendance() {
    const weeklyAttendance = document.getElementById('weekly-attendance');
    weeklyAttendance.innerHTML = '';

    // Compute Monday -> Sunday of the current week
    const now = new Date();
    const monday = new Date(now);
    const day = (now.getDay() + 6) % 7; // Monday=0
    monday.setDate(now.getDate() - day);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push({ date: d.toISOString().split('T')[0], day: dayNames[d.getDay()] });
    }

    // Sunday letters array
    const sundayLetters = ['S', 'U', 'N', 'D', 'A', 'Y'];

    // Create rows
    students.forEach((student, studentIndex) => {
        const row = document.createElement('tr');

        // Student cell
        const nameCell = document.createElement('td');
        nameCell.className = 'student-info';
        nameCell.innerHTML = `<div class="student-avatar">${student.charAt(0)}</div> ${student}`;
        row.appendChild(nameCell);

        // Day cells
        weekDates.forEach(dayInfo => {
            const dayCell = document.createElement('td');

            if (dayInfo.day === 'Sun') {
                // Sunday: show one letter per row (cycled)
                dayCell.textContent = sundayLetters[studentIndex % sundayLetters.length];
                dayCell.classList.add('holiday-cell');
            } else {
                // Click to toggle attendance
                dayCell.onclick = () => handleDayClick(student, dayInfo.date);
                dayCell.title = `Click to mark ${student}'s attendance for ${formatDate(dayInfo.date)}`;

                if (attendanceData[dayInfo.date] && attendanceData[dayInfo.date][student]) {
                    if (attendanceData[dayInfo.date][student] === 'present') {
                        dayCell.innerHTML = '<span class="tick">✅</span>';
                        dayCell.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                    } else {
                        dayCell.innerHTML = '<span class="cross">❌</span>';
                        dayCell.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    }
                } else {
                    dayCell.textContent = '-';
                    dayCell.style.backgroundColor = '';
                }

                if (student === selectedStudent) {
                    dayCell.style.fontWeight = 'bold';
                    dayCell.style.color = '#4f46e5';
                }
            }

            row.appendChild(dayCell);
        });

        weeklyAttendance.appendChild(row);
    });
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);