// ==============================
// CozyChores - JavaScript (Dark Theme)
// ==============================

// ===== DOM ELEMENTS =====
const sessionInfo = document.getElementById("session-info");
const sessionEmail = document.getElementById("session-user-email");
const logoutBtn = document.getElementById("logout-btn");
const leaveGroupBtn = document.getElementById("leave-group-btn");

const authSection = document.getElementById("auth-section");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showLoginBtn = document.getElementById("show-login");
const showSignupBtn = document.getElementById("show-signup");

const groupSection = document.getElementById("group-section");
const createGroupBtn = document.getElementById("create-group");
const joinGroupBtn = document.getElementById("join-group");
const groupCodeInput = document.getElementById("group-code");

const tasksSection = document.getElementById("tasks-section");
const memberList = document.getElementById("members");
const assigneeSelect = document.getElementById("assignee");
const taskForm = document.getElementById("task-form");
const taskNameInput = document.getElementById("task-name");
const dueDateInput = document.getElementById("due-date");
const taskNoteInput = document.getElementById("task-note");
const taskList = document.getElementById("tasks");
const groupIdDisplay = document.getElementById("group-id-display");

// ===== GLOBAL STATE =====
let currentUser = null;

// ===== Helper Functions =====

function saveUser(user) {
  let users = JSON.parse(localStorage.getItem("users") || "[]");
  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getTasks() {
  return JSON.parse(localStorage.getItem("tasks") || "[]");
}

function saveTask(task) {
  const tasks = getTasks();
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showSection(...visibleSections) {
  [authSection, groupSection, tasksSection].forEach(section => section.classList.add("hidden"));
  visibleSections.forEach(section => section.classList.remove("hidden"));
}

function updateMembers() {
  const users = getUsers().filter(u => u.groupId === currentUser.groupId);
  memberList.innerHTML = "";
  assigneeSelect.innerHTML = "";

  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user.name;
    memberList.appendChild(li);

    const option = document.createElement("option");
    option.value = user.email;
    option.textContent = user.name;
    assigneeSelect.appendChild(option);
  });
}

function updateTasks() {
  const tasks = getTasks().filter(task => task.groupId === currentUser.groupId);
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No tasks yet.";
    taskList.appendChild(li);
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${task.name}</strong> (Due: ${task.dueDate})<br>
      Assigned to: ${task.assigneeName} by ${task.assignerName}<br>
      Note: ${task.note || "None"}`;
    taskList.appendChild(li);
  });
}

// ✅ NEW: Always show Group ID in portal
function showGroupId() {
  if (currentUser?.groupId) {
    groupIdDisplay.textContent = `Group ID: ${currentUser.groupId}`;
    groupIdDisplay.classList.remove("hidden");
  } else {
    groupIdDisplay.textContent = "";
    groupIdDisplay.classList.add("hidden");
  }
}

function generateGroupId() {
  return "grp-" + Math.random().toString(36).substring(2, 6);
}

// ===== Auth Buttons =====

showLoginBtn.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
});

showSignupBtn.addEventListener("click", () => {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

// ===== Sign Up =====

signupForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;

  if (!name || !email || !password) {
    return alert("Please fill in all fields.");
  }

  const existing = getUsers().find(u => u.email === email);
  if (existing) return alert("Email already registered.");

  const newUser = { name, email, password, groupId: null };
  saveUser(newUser);

  alert("Account created! Please log in.");
  signupForm.reset();
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// ===== Log In =====

loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  const user = getUsers().find(u => u.email === email && u.password === password);
  if (!user) return alert("Invalid email or password.");

  currentUser = user;
  sessionEmail.textContent = currentUser.email;
  sessionInfo.classList.remove("hidden");
  loginForm.reset();

  if (!currentUser.groupId) {
    showSection(groupSection);
  } else {
    showSection(tasksSection);
    showGroupId(); // ✅ Show group ID even with 1 user
    updateMembers();
    updateTasks();
  }
});

// ===== Log Out =====

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  sessionEmail.textContent = "";
  sessionInfo.classList.add("hidden");
  groupIdDisplay.classList.add("hidden");
  showSection(authSection);
});

// ===== Leave Group =====

leaveGroupBtn.addEventListener("click", () => {
  if (!currentUser) return;
  const users = getUsers();
  const updatedUsers = users.map(u =>
    u.email === currentUser.email ? { ...u, groupId: null } : u
  );
  saveUsers(updatedUsers);
  currentUser.groupId = null;
  groupIdDisplay.classList.add("hidden");
  showSection(groupSection);
});

// ===== Create Group =====

createGroupBtn.addEventListener("click", () => {
  if (!currentUser) return;

  const groupId = generateGroupId();
  const users = getUsers();
  const updatedUsers = users.map(u =>
    u.email === currentUser.email ? { ...u, groupId } : u
  );

  saveUsers(updatedUsers);
  currentUser.groupId = groupId;

  alert("Group created! Share this code with your members: " + groupId);
  showSection(tasksSection);
  showGroupId(); // ✅ Always show group ID
  updateMembers();
  updateTasks();
});

// ===== Join Group =====

joinGroupBtn.addEventListener("click", () => {
  const code = groupCodeInput.value.trim();
  if (!code) return alert("Please enter a group code.");

  const users = getUsers();
  const groupExists = users.some(u => u.groupId === code);
  if (!groupExists) return alert("Group not found.");

  const updatedUsers = users.map(u =>
    u.email === currentUser.email ? { ...u, groupId: code } : u
  );

  saveUsers(updatedUsers);
  currentUser.groupId = code;

  showSection(tasksSection);
  showGroupId(); // ✅ Always show group ID
  updateMembers();
  updateTasks();
});

// ===== Assign Task =====

taskForm.addEventListener("submit", e => {
  e.preventDefault();

  const task = {
    name: taskNameInput.value.trim(),
    dueDate: dueDateInput.value,
    note: taskNoteInput.value.trim(),
    assignerEmail: currentUser.email,
    assignerName: currentUser.name,
    assigneeEmail: assigneeSelect.value,
    assigneeName: assigneeSelect.options[assigneeSelect.selectedIndex].text,
    groupId: currentUser.groupId
  };

  saveTask(task);
  taskForm.reset();
  updateTasks();
});
