import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

const sessionEmail = document.getElementById("session-user-email");
const logoutBtn = document.getElementById("logout-btn");
const createGroupBtn = document.getElementById("create-group");
const joinGroupBtn = document.getElementById("join-group");
const groupCodeInput = document.getElementById("group-code");
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("tasks");
const assigneeSelect = document.getElementById("assignee");
const taskNameInput = document.getElementById("task-name");
const dueDateInput = document.getElementById("due-date");
const taskNoteInput = document.getElementById("task-note");
const groupIdDisplay = document.getElementById("group-id-display");
const membersList = document.getElementById("members");
const groupSection = document.getElementById("group-section");
const tasksSection = document.getElementById("tasks-section");
const leaveGroupBtn = document.getElementById("leave-group-btn");

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

let currentUser = null;
let currentGroupId = null;
let currentUserName = "";

onAuthStateChanged(auth, async (user) => {
  if (!user || !user.emailVerified) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  sessionEmail.textContent = user.email;

  const name = localStorage.getItem("cozychores-user-name");
  if (name) {
    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      groupId: null
    }, { merge: true });
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();
  currentUserName = userData.name;
  currentGroupId = userData.groupId;

  const leaveGroupContainer = document.querySelector(".leave-group-container");

  if (currentGroupId && currentGroupId !== "null") { 
    showGroupSection(false);
    loadGroupData(currentGroupId);
    leaveGroupContainer.style.display = "block"; 
  } 
  
  else {
    showGroupSection(true);
    leaveGroupContainer.style.display = "none"; 
  }

  document.body.classList.add("loaded");

});

function showGroupSection(showGroup) {
  groupSection.classList.toggle("hidden", !showGroup);
  tasksSection.classList.toggle("hidden", showGroup);
}


createGroupBtn.addEventListener("click", async () => {
  const groupId = "grp-" + Math.random().toString(36).substring(2, 6);
  const groupRef = doc(db, "groups", groupId);
  await setDoc(groupRef, { createdAt: Date.now() });

  await updateDoc(doc(db, "users", currentUser.uid), {
    groupId
  });

  currentGroupId = groupId;
  showGroupSection(false);
  loadGroupData(groupId);
});

joinGroupBtn.addEventListener("click", async () => {
  const groupId = groupCodeInput.value.trim();
  if (!groupId) return alert("Please enter a group code.");

  const groupDoc = await getDoc(doc(db, "groups", groupId));
  if (!groupDoc.exists()) return alert("Group not found.");

  await updateDoc(doc(db, "users", currentUser.uid), {
    groupId
  });

  currentGroupId = groupId;
  showGroupSection(false);
  loadGroupData(groupId);
});

leaveGroupBtn.addEventListener("click", async () => {
  await updateDoc(doc(db, "users", currentUser.uid), {
    groupId: null
  });

  currentGroupId = null;

  taskList.innerHTML = "";
  chatMessages.innerHTML = "";
  assigneeSelect.innerHTML = "";
  membersList.innerHTML = "";
  groupCodeInput.value = "";

  window.location.href = "index.html";
});

function loadGroupData(groupId) {
  groupIdDisplay.textContent = `Group ID: ${groupId}`;

  const membersQuery = query(collection(db, "users"), where("groupId", "==", groupId));
  onSnapshot(membersQuery, (snapshot) => {
    membersList.innerHTML = "";
    assigneeSelect.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.textContent = data.name;
      membersList.appendChild(li);

      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = data.name;
      assigneeSelect.appendChild(option);
    });
  });

  const taskQuery = query(collection(db, "tasks"), where("groupId", "==", groupId));
  onSnapshot(taskQuery, (snapshot) => {
    taskList.innerHTML = "";
    if (snapshot.empty) {
      taskList.innerHTML = "<li>No tasks yet.</li>";
      return;
    }

    snapshot.forEach(docSnap => {
      const task = docSnap.data();
      const li = document.createElement("li");

      let actionButtons = "";

      if (task.assigneeId === currentUser.uid) {
        if (task.status === "completed") {
          actionButtons += `<button onclick="undoTask('${docSnap.id}')">Undo</button>`;
        } 
        else {
          actionButtons += 
            `<button onclick="markDone('${docSnap.id}')">Done</button>
            <button onclick="requestMoreTime('${docSnap.id}')">Request More Time</button>`;
        }
  }

  if (task.assignerName === currentUserName) {
    actionButtons += `<button onclick="deleteTask('${docSnap.id}')">Delete</button>`;
  }

  li.innerHTML = `
    <strong>${task.name}</strong> (Due: ${task.dueDate})<br>
    Assigned to: ${task.assigneeName} by ${task.assignerName}<br>
    Note: ${task.note || "None"}<br>
    Status: ${task.status || "pending"}<br>
    ${actionButtons}
  `;

  li.dataset.status = task.status || "pending";
  taskList.appendChild(li);
});

  });

  const chatQuery = query(
    collection(db, "chats"),
    where("groupId", "==", currentGroupId),
    orderBy("createdAt")
  );

  onSnapshot(chatQuery, (snapshot) => {
    chatMessages.innerHTML = "";
    snapshot.forEach(docSnap => {
      const chat = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `<strong>${chat.senderName || "Unknown"}:</strong> ${chat.message}`;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const assigneeId = assigneeSelect.value;
  const assigneeName = assigneeSelect.options[assigneeSelect.selectedIndex].text;
  const assignerName = currentUserName;

  await addDoc(collection(db, "tasks"), {
    name: taskNameInput.value,
    dueDate: dueDateInput.value,
    note: taskNoteInput.value,
    assignerName,
    assigneeId,
    assigneeName,
    groupId: currentGroupId,
    status: "pending",
    createdAt: Date.now()
  });

  taskForm.reset();
});

window.markDone = async (taskId) => {
  await updateDoc(doc(db, "tasks", taskId), {
    status: "completed"
  });
};

window.requestMoreTime = async (taskId) => {
  await updateDoc(doc(db, "tasks", taskId), {
    status: "request"
  });
};

window.undoTask = async (taskId) => {
  await updateDoc(doc(db, "tasks", taskId), {
    status: "pending"
  });
};

window.deleteTask = async (taskId) => {
  const confirmDelete = confirm("Are you sure you want to delete this task?");
  if (confirmDelete) {
    await deleteDoc(doc(db, "tasks", taskId));
  }
};

const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    const tasks = document.querySelectorAll("#tasks li");
    tasks.forEach(task => {
      task.style.display =
        filter === "all" || task.dataset.status === filter
          ? "block"
          : "none";
    });
  });
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  await addDoc(collection(db, "chats"), {
    groupId: currentGroupId,
    message,
    senderId: currentUser.uid,
    senderName: currentUserName,
    createdAt: serverTimestamp() 
  });

  chatInput.value = "";
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  window.location.href = "index.html";
});

