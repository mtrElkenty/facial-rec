const API_URL = "http://localhost:5000";

// Utility function for API calls with loader
async function apiCall(url, options = {}) {
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
  } finally {
    loader.classList.add("hidden");
  }
}

// Navigation
document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    // Update active button
    document
      .querySelectorAll(".nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Show corresponding page
    const pageId = button.dataset.page;
    document
      .querySelectorAll(".page")
      .forEach((page) => page.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");

    // Load attendance data if on attendance page
    if (pageId === "attendance") {
      loadAttendance();
    }
  });
});

// File upload preview
document.querySelectorAll(".upload-area").forEach((area) => {
  const input = area.querySelector('input[type="file"]');
  const span = area.querySelector("span");

  // Create preview container and count badge
  const previewContainer = document.createElement("div");
  previewContainer.className = "preview-container";
  area.appendChild(previewContainer);

  const previewCount = document.createElement("div");
  previewCount.className = "preview-count";
  area.appendChild(previewCount);

  // Make the entire area clickable
  area.addEventListener("click", () => {
    input.click();
  });

  input.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      span.textContent =
        files.length === 1
          ? "1 photo selected"
          : `${files.length} photos selected`;

      // Clear existing previews
      previewContainer.innerHTML = "";

      // Create previews for each file
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = document.createElement("img");
          preview.className = "preview";
          preview.src = e.target.result;
          previewContainer.appendChild(preview);
        };
        reader.readAsDataURL(file);
      });

      // Update preview count
      previewCount.textContent = files.length;
      area.classList.add("has-preview");
    }
  });

  // Reset preview when form is reset
  const form = area.closest("form");
  if (form) {
    form.addEventListener("reset", () => {
      previewContainer.innerHTML = "";
      area.classList.remove("has-preview");
      span.textContent =
        area.id === "registerUpload"
          ? "Select photos"
          : "Select photos to match";
    });
  }
});

// Toggle registration form
const toggleRegisterForm = document.getElementById("toggleRegisterForm");
const registerFormContainer = document.getElementById("registerFormContainer");

toggleRegisterForm.addEventListener("click", () => {
  registerFormContainer.classList.toggle("hidden");
  toggleRegisterForm.textContent = registerFormContainer.classList.contains(
    "hidden"
  )
    ? "Register New Student"
    : "Cancel Registration";
});

// Fetch and display students
async function fetchStudents() {
  try {
    const { data } = await apiCall(`${API_URL}/students`);
    const students = data["students"];
    displayStudents(students);
  } catch (error) {
    console.error("Error fetching students:", error);
  }
}

let allStudents = []; // Store all students for filtering

function displayStudents(students) {
  allStudents = students; // Store the full list
  filterAndDisplayStudents();
}

function filterAndDisplayStudents() {
  const searchTerm = document
    .getElementById("studentSearch")
    .value.toLowerCase();
  const filteredStudents = allStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm)
  );

  const studentsList = document.getElementById("studentsList");
  studentsList.innerHTML = filteredStudents
    .map(
      (student) => `
        <tr>
            <td>ST${student.id}</td>
            <td class="student-cell">
              ${
                student.image_path
                  ? `<img src="${API_URL}/uploads/${student.image_path}" alt="${student.name}" class="student-thumbnail">`
                  : '<div class="student-thumbnail placeholder">No Image</div>'
              }
            </td>
            <td>${student.name}</td>
            <td>${new Date(student.created_at).toLocaleString()}</td>
            <td>
                <button class="btn small" onclick="viewStudent('${
                  student.id
                }')">View</button>
                <button class="btn small danger" onclick="deleteStudent('${
                  student.id
                }')">Delete</button>
            </td>
        </tr>
    `
    )
    .join("");
}

// Add search input event listener
document
  .getElementById("studentSearch")
  .addEventListener("input", filterAndDisplayStudents);

// Fetch students when the page loads
document.addEventListener("DOMContentLoaded", () => {
  fetchStudents();

  // Modal functionality
  const studentModal = document.getElementById("studentModal");
  const modalClose = document.querySelector(".modal-close");

  // Close modal when clicking the close button
  modalClose.addEventListener("click", () => {
    studentModal.classList.add("hidden");
  });

  // Close modal when clicking outside the modal content
  studentModal.addEventListener("click", (e) => {
    if (e.target === studentModal) {
      studentModal.classList.add("hidden");
    }
  });
});

// Handle student registration
document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    formData.append("name", document.getElementById("studentName").value);

    // Append all selected files
    const files = form.querySelector('input[type="file"]').files;
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      const { response } = await apiCall(`${API_URL}/students`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Hide the form and refresh the students list
        registerFormContainer.classList.add("hidden");
        toggleRegisterForm.textContent = "Register New Student";
        fetchStudents();
        e.target.reset();
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Error registering student:", error);
      alert("Failed to register student. Please try again.");
    }
  });

// Match form
document.getElementById("matchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();

  // Append all selected files
  const files = form.querySelector('input[type="file"]').files;
  formData.append("image", files[0]);

  try {
    const { response, data } = await apiCall(`${API_URL}/match`, {
      method: "POST",
      body: formData,
    });

    const resultDiv = document.getElementById("matchResult");

    if (response.ok) {
      resultDiv.textContent = `Match found: ${data.match}`;
      resultDiv.classList.add("show");
    } else {
      resultDiv.textContent = `Error: ${data.error}`;
      resultDiv.classList.add("show");
    }
  } catch (error) {
    alert("Error connecting to the server");
  }
});

// Load attendance
async function loadAttendance() {
  try {
    const { data } = await apiCall(`${API_URL}/attendance`);
    const attendance = data["attendance"];

    const tbody = document.getElementById("attendanceList");
    tbody.innerHTML = "";

    attendance.forEach((record) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${record.name}</td>
                <td>${new Date(record.timestamp).toLocaleString()}</td>
            `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading attendance:", error);
  }
}

// View student details
async function viewStudent(studentId) {
  try {
    const { response, data: student } = await apiCall(
      `${API_URL}/students/${studentId}`
    );

    if (response.ok) {
      // Update modal content
      document.getElementById("modalStudentId").textContent = `ST${student.id}`;
      document.getElementById("modalStudentName").textContent = student.name;
      document.getElementById("modalStudentDate").textContent = new Date(
        student.created_at
      ).toLocaleString();

      // Add image to modal if available
      const modalBody = document.querySelector(".modal-body");
      const existingImage = modalBody.querySelector(".student-image");
      if (existingImage) {
        existingImage.remove();
      }

      if (student.image_path) {
        const imageContainer = document.createElement("div");
        imageContainer.className = "student-image";
        imageContainer.innerHTML = `
          <img src="${API_URL}/uploads/${student.image_path}" alt="${student.name}">
        `;
        modalBody.insertBefore(imageContainer, modalBody.firstChild);
      }

      // Show modal
      document.getElementById("studentModal").classList.remove("hidden");
    } else {
      alert(`Error: ${student.error}`);
    }
  } catch (error) {
    console.error("Error viewing student:", error);
    alert("Failed to view student details. Please try again.");
  }
}

// Delete student
async function deleteStudent(studentId) {
  if (!confirm("Are you sure you want to delete this student?")) {
    return;
  }

  try {
    const { response, data } = await apiCall(
      `${API_URL}/students/${studentId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      alert("Student deleted successfully");
      fetchStudents(); // Refresh the students list
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error("Error deleting student:", error);
    alert("Failed to delete student. Please try again.");
  }
}

// Initial attendance load
loadAttendance();
