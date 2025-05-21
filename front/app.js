const API_URL = "http://localhost:5000";

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

// Register form
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
      const response = await fetch(`${API_URL}/students`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("Student registered successfully!");
        form.reset();
        document.querySelector("#registerUpload span").textContent =
          "Select photos";
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Error connecting to the server");
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
    const response = await fetch(`${API_URL}/match`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
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
    const response = await fetch(`${API_URL}/attendance`);
    const data = await response.json();

    const tbody = document.getElementById("attendanceList");
    tbody.innerHTML = "";

    data.attendance.forEach((record) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${record[0]}</td>
                <td>${record[1]}</td>
            `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading attendance:", error);
  }
}

// Initial attendance load
loadAttendance();
