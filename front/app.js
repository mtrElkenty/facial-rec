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
  area.addEventListener("click", (e) => {
    // Only trigger if clicking the area itself, not its children
    if (e.target === area) {
      input.click();
    }
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
    console.log("Form submission started");
    e.preventDefault();

    const form = e.target;
    const formData = new FormData();

    const studentName = document.getElementById("studentName").value;
    console.log("Student name:", studentName);
    formData.append("name", studentName);

    // Get files from the file input
    const fileInput = form.querySelector('#registerUpload input[type="file"]');
    if (!fileInput || fileInput.files.length === 0) {
      alert("Please select at least one photo");
      return;
    }

    console.log("Number of files:", fileInput.files.length);

    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append("images", fileInput.files[i]);
    }

    try {
      console.log("Sending request to server...");
      const { response } = await apiCall(`${API_URL}/students`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Registration successful");
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

// Camera functionality
let stream = null;
const cameraPreview = document.getElementById("cameraPreview");
const captureBtn = document.getElementById("captureBtn");
const toggleCameraBtn = document.getElementById("toggleCameraBtn");
const cameraContainer = document.getElementById("cameraContainer");
const uploadContainer = document.getElementById("uploadContainer");
const fileInput = document.querySelector('#registerUpload input[type="file"]');
const browseFileBtn = document.getElementById("browseFileBtn");

// Toggle between camera and file upload
toggleCameraBtn.addEventListener("click", async () => {
  if (stream) {
    // If camera is active, switch to file upload
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    cameraContainer.style.display = "none";
    uploadContainer.style.display = "none";
    browseFileBtn.style.display = "inline-block";
    toggleCameraBtn.textContent = "Use Camera";
  } else {
    // If file upload is active, switch to camera
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraPreview.srcObject = stream;
      cameraContainer.style.display = "block";
      uploadContainer.style.display = "none";
      browseFileBtn.style.display = "none";
      toggleCameraBtn.textContent = "Switch to File Upload";
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(
        "Could not access camera. Please make sure you have granted camera permissions."
      );
    }
  }
});

browseFileBtn.addEventListener("click", () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  cameraContainer.style.display = "none";
  uploadContainer.style.display = "none";
  browseFileBtn.style.display = "inline-block";
  toggleCameraBtn.textContent = "Use Camera";
  fileInput.click();
});

// Capture photo from camera
captureBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = cameraPreview.videoWidth;
  canvas.height = cameraPreview.videoHeight;
  canvas.getContext("2d").drawImage(cameraPreview, 0, 0);

  // Convert canvas to blob
  canvas.toBlob((blob) => {
    const file = new File([blob], `photo_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    // Create a FileList-like object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Update the file input
    fileInput.files = dataTransfer.files;

    // Trigger the file input change event to update previews
    const event = new Event("change", { bubbles: true });
    fileInput.dispatchEvent(event);
  }, "image/jpeg");
});

// Clean up camera when form is reset
document.getElementById("registerForm").addEventListener("reset", () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  cameraContainer.style.display = "none";
  uploadContainer.style.display = "none";
  browseFileBtn.style.display = "inline-block";
  toggleCameraBtn.textContent = "Use Camera";
});

// Match form camera functionality
let matchStream = null;
const matchCameraPreview = document.getElementById("matchCameraPreview");
const matchCaptureBtn = document.getElementById("matchCaptureBtn");
const matchToggleCameraBtn = document.getElementById("matchToggleCameraBtn");
const matchCameraContainer = document.getElementById("matchCameraContainer");
const matchUploadContainer = document.getElementById("matchUploadContainer");
const matchFileInput = document.querySelector(
  '#matchUpload input[type="file"]'
);
const matchBrowseFileBtn = document.getElementById("matchBrowseFileBtn");

// Toggle between camera and file upload for match form
matchToggleCameraBtn.addEventListener("click", async () => {
  if (matchStream) {
    // If camera is active, switch to file upload
    matchStream.getTracks().forEach((track) => track.stop());
    matchStream = null;
    matchCameraContainer.style.display = "none";
    matchUploadContainer.style.display = "none";
    matchBrowseFileBtn.style.display = "inline-block";
    matchToggleCameraBtn.textContent = "Use Camera";
  } else {
    // If file upload is active, switch to camera
    try {
      matchStream = await navigator.mediaDevices.getUserMedia({ video: true });
      matchCameraPreview.srcObject = matchStream;
      matchCameraContainer.style.display = "block";
      matchUploadContainer.style.display = "none";
      matchBrowseFileBtn.style.display = "none";
      matchToggleCameraBtn.textContent = "Switch to File Upload";
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(
        "Could not access camera. Please make sure you have granted camera permissions."
      );
    }
  }
});

matchBrowseFileBtn.addEventListener("click", () => {
  if (matchStream) {
    matchStream.getTracks().forEach((track) => track.stop());
    matchStream = null;
  }
  matchCameraContainer.style.display = "none";
  matchUploadContainer.style.display = "none";
  matchBrowseFileBtn.style.display = "inline-block";
  matchToggleCameraBtn.textContent = "Use Camera";
  matchFileInput.click();
});

// Capture photo from camera for match form
matchCaptureBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = matchCameraPreview.videoWidth;
  canvas.height = matchCameraPreview.videoHeight;
  canvas.getContext("2d").drawImage(matchCameraPreview, 0, 0);

  // Convert canvas to blob
  canvas.toBlob((blob) => {
    const file = new File([blob], `photo_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    // Create a FileList-like object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Update the file input
    matchFileInput.files = dataTransfer.files;

    // Trigger the file input change event to update previews
    const event = new Event("change", { bubbles: true });
    matchFileInput.dispatchEvent(event);
  }, "image/jpeg");
});

// Clean up camera when match form is reset
document.getElementById("matchForm").addEventListener("reset", () => {
  if (matchStream) {
    matchStream.getTracks().forEach((track) => track.stop());
    matchStream = null;
  }
  matchCameraContainer.style.display = "none";
  matchUploadContainer.style.display = "none";
  matchBrowseFileBtn.style.display = "inline-block";
  matchToggleCameraBtn.textContent = "Use Camera";
});
