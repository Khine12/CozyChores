// index.js – CozyChores Firebase Auth Logic

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Wait for DOM to be fully loaded
window.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const forgotPasswordLink = document.getElementById("forgot-password-link");

  // Sign Up
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    if (!name || !email || !password) {
      return alert("Please fill in all fields.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      localStorage.setItem("cozychores-user-name", name);

      await sendEmailVerification(user);
      alert("Sign up successful! Please verify your email before logging in.");
      signupForm.reset();
    } catch (error) {
      alert("Sign up error: " + error.message);
    }
  });

  // Log In
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("Please verify your email before logging in.");
        return;
      }

      localStorage.setItem("cozychores-user-email", user.email);
      window.location.href = "dashboard.html";
    } catch (error) {
      alert("Login error: " + error.message);
    }
  });

  // Forgot Password
  forgotPasswordLink.addEventListener("click", async () => {
    const email = prompt("Enter your email to reset your password:");
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
      alert("Reset password error: " + error.message);
    }
  });

  // Optional: Redirect to dashboard if already logged in
  onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
      window.location.href = "dashboard.html";
    }
  });
});
