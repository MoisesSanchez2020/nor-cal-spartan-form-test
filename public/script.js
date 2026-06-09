const form = document.getElementById('scaffoldForm');
const toast = document.getElementById('toast');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const dropZone = document.getElementById('dropZone');
const mobileMenu = document.querySelector('.mobile-menu');
const siteHeader = document.querySelector('.site-header');

let selectedFiles = [];
const maxFiles = 10;
const maxFileSize = 25 * 1024 * 1024;

mobileMenu.addEventListener('click', () => {
  siteHeader.classList.toggle('open');
});

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 5500);
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function renderFiles() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${file.name} — ${formatBytes(file.size)}</span>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      renderFiles();
    });
    li.appendChild(btn);
    fileList.appendChild(li);
  });
}

function addFiles(files) {
  const incoming = Array.from(files);

  for (const file of incoming) {
    if (selectedFiles.length >= maxFiles) {
      showToast(`Maximum ${maxFiles} files allowed.`, 'error');
      break;
    }

    if (file.size > maxFileSize) {
      showToast(`${file.name} is larger than 25MB.`, 'error');
      continue;
    }

    selectedFiles.push(file);
  }

  renderFiles();
}

fileInput.addEventListener('change', (event) => {
  addFiles(event.target.files);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
  });
});

dropZone.addEventListener('drop', (event) => {
  addFiles(event.dataTransfer.files);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('.submit-btn');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    const formData = new FormData(form);
    formData.delete('files');

    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch('/api/scaffold-request', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Something went wrong.');
    }

    form.reset();
    selectedFiles = [];
    renderFiles();
    showToast('Request submitted successfully. We will contact you soon.', 'success');
  } catch (error) {
    showToast(error.message || 'Could not send request. Please try again.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = '➤ Submit Request';
  }
});
