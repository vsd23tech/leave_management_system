/* ==========================================================================
   Apply Leave Screen JavaScript
   - Interactive leave type selection
   - Date picker functionality with Flatpickr
   - Duration calculation and validation
   - Form submission handling
   ========================================================================== */

(function () {
    'use strict';

    // --- State Management --------------------------------------------------
    let selectedLeaveType = null;
    let selectedStartDate = null;
    let selectedEndDate = null;
    let leaveDuration = 0;

    // --- DOM Elements ----------------------------------------------------
    const leaveTypeCards = document.querySelectorAll('.leave-type-card');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const durationValue = document.getElementById('duration-value');
    const balanceNumber = document.getElementById('balance-number');
    const selectedDays = document.getElementById('selected-days');
    const remainingDays = document.getElementById('remaining-days');
    const leaveReason = document.getElementById('leave-reason');
    const charCount = document.getElementById('char-count');
    const submitButton = document.getElementById('submit-leave');
    const saveDraftButton = document.getElementById('save-draft');
    const termsCheckbox = document.getElementById('terms-checkbox');
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const browseFiles = document.getElementById('browse-files');
    const uploadedFiles = document.getElementById('uploaded-files');
    const fileList = document.getElementById('file-list');

    // --- File Upload State -----------------------------------------------
    let uploadedFilesList = [];

    // --- Leave Type Selection ---------------------------------------------
    function initializeLeaveTypeSelection() {
        leaveTypeCards.forEach(card => {
            card.addEventListener('click', function () {
                // Remove previous selection
                leaveTypeCards.forEach(c => c.classList.remove('selected'));

                // Add selection to clicked card
                this.classList.add('selected');

                // Update selected leave type
                selectedLeaveType = this.dataset.leaveType;
                const availableDays = parseInt(this.dataset.available) || 0;

                // Update balance display
                updateBalanceDisplay(availableDays);

                // Update submit button state
                updateSubmitButtonState();

                // Add visual feedback
                this.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);
            });
        });
    }

    // --- Date Picker Initialization --------------------------------------
    function initializeDatePickers() {
        // Configure Flatpickr options
        const datePickerOptions = {
            dateFormat: 'Y-m-d',
            minDate: 'today',
            disable: [
                function (date) {
                    // Disable weekends (Saturday = 6, Sunday = 0)
                    return date.getDay() === 0 || date.getDay() === 6;
                }
            ],
            onChange: function (selectedDates, dateStr, instance) {
                if (instance.element === startDateInput) {
                    selectedStartDate = selectedDates[0];
                    // Update end date min date
                    if (endDateInput._flatpickr) {
                        endDateInput._flatpickr.set('minDate', selectedDates[0]);
                    }
                } else if (instance.element === endDateInput) {
                    selectedEndDate = selectedDates[0];
                }

                calculateDuration();
                updateSubmitButtonState();
            }
        };

        // Initialize start date picker
        if (startDateInput) {
            startDateInput._flatpickr = flatpickr(startDateInput, {
                ...datePickerOptions,
                onChange: function (selectedDates, dateStr, instance) {
                    selectedStartDate = selectedDates[0];
                    if (endDateInput._flatpickr) {
                        endDateInput._flatpickr.set('minDate', selectedDates[0]);
                    }
                    calculateDuration();
                    updateSubmitButtonState();
                }
            });
        }

        // Initialize end date picker
        if (endDateInput) {
            endDateInput._flatpickr = flatpickr(endDateInput, {
                ...datePickerOptions,
                onChange: function (selectedDates, dateStr, instance) {
                    selectedEndDate = selectedDates[0];
                    calculateDuration();
                    updateSubmitButtonState();
                }
            });
        }
    }

    // --- Duration Calculation ---------------------------------------------
    function calculateDuration() {
        if (selectedStartDate && selectedEndDate) {
            const start = new Date(selectedStartDate);
            const end = new Date(selectedEndDate);

            // Calculate business days (excluding weekends)
            let businessDays = 0;
            const current = new Date(start);

            while (current <= end) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
                    businessDays++;
                }
                current.setDate(current.getDate() + 1);
            }

            leaveDuration = businessDays;
            durationValue.textContent = `${businessDays} day${businessDays !== 1 ? 's' : ''}`;

            // Update applied days display
            const appliedDaysElement = document.getElementById('applied-days');
            if (appliedDaysElement) {
                appliedDaysElement.textContent = `${businessDays} days`;
            }

            // Update remaining days based on leave type
            if (selectedLeaveType && selectedLeaveType !== 'unpaid') {
                const availableDays = parseInt(document.querySelector('.leave-type-card.selected')?.dataset.available) || 0;
                let remaining = 0;

                // Special handling for different leave types
                if (selectedLeaveType === 'maternity') {
                    // Maternity leave is typically a one-time benefit
                    remaining = Math.max(0, availableDays - businessDays);
                } else if (selectedLeaveType === 'paternity') {
                    // Paternity leave is usually per child
                    remaining = Math.max(0, availableDays - businessDays);
                } else if (selectedLeaveType === 'compensatory') {
                    // Compensatory off is earned through overtime
                    remaining = Math.max(0, availableDays - businessDays);
                } else if (selectedLeaveType === 'bereavement') {
                    // Bereavement leave is per incident
                    remaining = Math.max(0, availableDays - businessDays);
                } else {
                    // Regular leave types (sick, earned, casual)
                    remaining = Math.max(0, availableDays - businessDays);
                }

                // Update the balance circle to show remaining balance
                updateBalanceCircle(remaining);

                // Show warning for insufficient balance
                if (businessDays > availableDays && selectedLeaveType !== 'unpaid') {
                    showInsufficientBalanceWarning(businessDays, availableDays);
                } else {
                    hideInsufficientBalanceWarning();
                }
            } else if (selectedLeaveType === 'unpaid') {
                // For unpaid leave, show applied days in circle
                updateBalanceCircle(businessDays);
            }
        } else {
            leaveDuration = 0;
            durationValue.textContent = '0 days';

            // Reset applied days
            const appliedDaysElement = document.getElementById('applied-days');
            if (appliedDaysElement) {
                appliedDaysElement.textContent = '0 days';
            }

            // Reset remaining balance to original
            if (window.originalAvailableDays) {
                const remainingBalanceElement = document.getElementById('remaining-balance');
                if (remainingBalanceElement) {
                    remainingBalanceElement.textContent = `${window.originalAvailableDays} days`;
                }
                updateBalanceCircle(window.originalAvailableDays);
            }
        }
    }

    // --- Balance Display Updates -----------------------------------------
    function updateBalanceDisplay(availableDays) {
        // Store the original available days for calculations
        if (!window.originalAvailableDays) {
            window.originalAvailableDays = availableDays;
        }

        // Update the previous balance display
        const previousBalanceElement = document.getElementById('previous-balance');
        if (previousBalanceElement) {
            previousBalanceElement.textContent = `${availableDays} days`;
        }

        // Update the balance circle to show remaining balance
        updateBalanceCircle(availableDays);

        // Update the applied days (initially 0)
        const appliedDaysElement = document.getElementById('applied-days');
        if (appliedDaysElement) {
            appliedDaysElement.textContent = '0 days';
        }
    }

    function updateBalanceCircle(remainingDays) {
        const balanceNumber = document.getElementById('balance-number');
        if (balanceNumber) {
            balanceNumber.textContent = remainingDays;
        }

        // Update the balance circle color based on remaining days percentage
        const balanceCircle = document.getElementById('balance-circle');
        if (balanceCircle && window.originalAvailableDays) {
            const totalDays = window.originalAvailableDays;
            const percentage = (remainingDays / totalDays) * 100;
            updateBalanceCircleColor(remainingDays, totalDays);
        }
    }

    function updateBalanceCircleColor(remaining, total) {
        const balanceCircle = document.getElementById('balance-circle');
        if (!balanceCircle) return;

        // Remove existing color classes
        balanceCircle.classList.remove('balance-success', 'balance-warning', 'balance-info', 'balance-danger');

        const percentage = (remaining / total) * 100;

        if (percentage >= 70) {
            balanceCircle.classList.add('balance-success');
        } else if (percentage >= 40) {
            balanceCircle.classList.add('balance-warning');
        } else if (percentage >= 20) {
            balanceCircle.classList.add('balance-info');
        } else {
            balanceCircle.classList.add('balance-danger');
        }
    }

    // --- Insufficient Balance Warning -------------------------------------
    function showInsufficientBalanceWarning(requested, available) {
        // Remove existing warning
        hideInsufficientBalanceWarning();

        // Create warning element
        const warning = document.createElement('div');
        warning.id = 'insufficient-balance-warning';
        warning.className = 'alert alert-warning alert-dismissible fade show mt-3';
        warning.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Insufficient Balance:</strong> You're requesting ${requested} days but only have ${available} days available.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert after duration display
        const durationDisplay = document.querySelector('.duration-display');
        if (durationDisplay && durationDisplay.parentNode) {
            durationDisplay.parentNode.insertBefore(warning, durationDisplay.nextSibling);
        }
    }

    function hideInsufficientBalanceWarning() {
        const existingWarning = document.getElementById('insufficient-balance-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
    }

    // --- Character Count for Reason --------------------------------------
    function initializeCharacterCount() {
        if (leaveReason) {
            leaveReason.addEventListener('input', function () {
                const count = this.value.length;
                charCount.textContent = count;

                // Update submit button state
                updateSubmitButtonState();

                // Visual feedback for character limit
                if (count > 400) {
                    charCount.style.color = 'var(--brand-warning)';
                } else if (count > 450) {
                    charCount.style.color = 'var(--brand-danger)';
                } else {
                    charCount.style.color = 'var(--text-muted)';
                }
            });
        }
    }

    // --- File Upload Initialization --------------------------------------
    function initializeFileUpload() {
        // Browse files click handler
        browseFiles.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        // File input change handler
        fileInput.addEventListener('change', handleFileSelection);

        // Drag and drop handlers
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleDrop);
        uploadZone.addEventListener('click', () => fileInput.click());
    }

    // --- File Handling Functions -----------------------------------------
    function handleFileSelection(event) {
        const files = Array.from(event.target.files);
        processFiles(files);
    }

    function handleDragOver(event) {
        event.preventDefault();
        uploadZone.classList.add('dragover');
    }

    function handleDragLeave(event) {
        event.preventDefault();
        uploadZone.classList.remove('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = Array.from(event.dataTransfer.files);
        processFiles(files);
    }

    function processFiles(files) {
        files.forEach(file => {
            if (validateFile(file)) {
                addFileToList(file);
            }
        });
        updateFileUploadDisplay();
    }

    function validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

        if (file.size > maxSize) {
            showNotification(`File "${file.name}" is too large. Maximum size is 5MB.`, 'warning');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            showNotification(`File "${file.name}" is not a supported type. Please use PDF, DOC, or images.`, 'warning');
            return false;
        }

        return true;
    }

    function addFileToList(file) {
        const fileId = Date.now() + Math.random();
        const fileObj = {
            id: fileId,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type
        };
        uploadedFilesList.push(fileObj);
    }

    function removeFileFromList(fileId) {
        uploadedFilesList = uploadedFilesList.filter(f => f.id !== fileId);
        updateFileUploadDisplay();
    }

    function updateFileUploadDisplay() {
        if (uploadedFilesList.length > 0) {
            uploadedFiles.style.display = 'block';
            renderFileList();
        } else {
            uploadedFiles.style.display = 'none';
        }
    }

    function renderFileList() {
        fileList.innerHTML = '';
        uploadedFilesList.forEach(fileObj => {
            const fileItem = createFileItem(fileObj);
            fileList.appendChild(fileItem);
        });
    }

    function createFileItem(fileObj) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileIconClass = getFileIconClass(fileObj.type);
        const fileSize = formatFileSize(fileObj.size);

        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon ${fileIconClass}">
                    <i class="bi ${getFileIcon(fileObj.type)}"></i>
                </div>
                <div class="file-details">
                    <div class="file-name">${fileObj.name}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-remove" onclick="removeFileFromList('${fileObj.id}')">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        return fileItem;
    }

    function getFileIconClass(type) {
        if (type.includes('pdf')) return 'pdf';
        if (type.includes('word') || type.includes('document')) return 'doc';
        if (type.includes('image')) return 'img';
        return 'doc';
    }

    function getFileIcon(type) {
        if (type.includes('pdf')) return 'bi-file-pdf';
        if (type.includes('word') || type.includes('document')) return 'bi-file-word';
        if (type.includes('image')) return 'bi-file-image';
        return 'bi-file-text';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // --- Submit Button State Management ----------------------------------
    function updateSubmitButtonState() {
        const isFormValid = selectedLeaveType &&
            selectedStartDate &&
            selectedEndDate &&
            leaveDuration > 0 &&
            leaveReason.value.trim().length > 0 &&
            termsCheckbox.checked; // Add terms checkbox validation

        submitButton.disabled = !isFormValid;

        if (isFormValid) {
            submitButton.classList.remove('btn-secondary');
            submitButton.classList.add('btn-primary');
        } else {
            submitButton.classList.remove('btn-primary');
            submitButton.classList.add('btn-secondary');
        }
    }

    // --- Form Submission Handling ----------------------------------------
    function initializeFormSubmission() {
        if (submitButton) {
            submitButton.addEventListener('click', function (e) {
                e.preventDefault();

                if (submitButton.disabled) return;

                // Show loading state
                submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Submitting...';
                submitButton.disabled = true;

                // Collect form data
                const formData = {
                    leaveType: selectedLeaveType,
                    startDate: selectedStartDate.toISOString().split('T')[0],
                    endDate: selectedEndDate.toISOString().split('T')[0],
                    duration: leaveDuration,
                    reason: leaveReason.value.trim(),
                    availableBalance: parseInt(document.querySelector('.leave-type-card.selected')?.dataset.available) || 0,
                    files: uploadedFilesList // Include uploaded files
                };

                // Simulate API call (replace with actual endpoint)
                setTimeout(() => {
                    console.log('Leave request submitted:', formData);

                    // Show success message
                    showNotification('Leave request submitted successfully!', 'success');

                    // Reset form
                    resetForm();

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        window.location.href = '/employee/dashboard';
                    }, 2000);
                }, 1500);
            });
        }

        if (saveDraftButton) {
            saveDraftButton.addEventListener('click', function (e) {
                e.preventDefault();

                // Save form data to localStorage
                const draftData = {
                    leaveType: selectedLeaveType,
                    startDate: selectedStartDate?.toISOString().split('T')[0] || '',
                    endDate: selectedEndDate?.toISOString().split('T')[0] || '',
                    reason: leaveReason.value.trim(),
                    timestamp: new Date().toISOString()
                };

                localStorage.setItem('leaveRequestDraft', JSON.stringify(draftData));

                showNotification('Draft saved successfully!', 'info');
            });
        }
    }

    // --- Form Reset ------------------------------------------------------
    function resetForm() {
        // Reset leave type selection
        leaveTypeCards.forEach(card => card.classList.remove('selected'));
        selectedLeaveType = null;

        // Reset date inputs
        if (startDateInput._flatpickr) {
            startDateInput._flatpickr.clear();
        }
        if (endDateInput._flatpickr) {
            endDateInput._flatpickr.clear();
        }
        selectedStartDate = null;
        selectedEndDate = null;

        // Reset duration
        leaveDuration = 0;
        durationValue.textContent = '0 days';

        // Reset balance display
        if (window.originalAvailableDays) {
            updateBalanceCircle(window.originalAvailableDays);
        }

        // Reset applied days
        const appliedDaysElement = document.getElementById('applied-days');
        if (appliedDaysElement) {
            appliedDaysElement.textContent = '0 days';
        }

        // Reset reason
        leaveReason.value = '';
        charCount.textContent = '0';

        // Reset file uploads
        uploadedFilesList = [];
        updateFileUploadDisplay();

        // Reset submit button
        updateSubmitButtonState();

        // Hide any warnings
        hideInsufficientBalanceWarning();

        // Reset balance circle color
        const balanceCircle = document.getElementById('balance-circle');
        if (balanceCircle) {
            balanceCircle.classList.remove('balance-success', 'balance-warning', 'balance-info', 'balance-danger');
        }
    }

    // --- Notification System ---------------------------------------------
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // --- Load Draft Data -------------------------------------------------
    function loadDraftData() {
        const draftData = localStorage.getItem('leaveRequestDraft');
        if (draftData) {
            try {
                const draft = JSON.parse(draftData);

                // Check if draft is less than 24 hours old
                const draftAge = new Date() - new Date(draft.timestamp);
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (draftAge < maxAge) {
                    // Restore draft data
                    if (draft.leaveType) {
                        const card = document.querySelector(`[data-leave-type="${draft.leaveType}"]`);
                        if (card) {
                            card.click();
                        }
                    }

                    if (draft.reason) {
                        leaveReason.value = draft.reason;
                        charCount.textContent = draft.reason.length;
                    }

                    showNotification('Draft data loaded from previous session', 'info');
                } else {
                    // Remove expired draft
                    localStorage.removeItem('leaveRequestDraft');
                }
            } catch (error) {
                console.error('Error loading draft data:', error);
                localStorage.removeItem('leaveRequestDraft');
            }
        }
    }

    // --- Initialize Everything -------------------------------------------
    function initialize() {
        initializeLeaveTypeSelection();
        initializeDatePickers();
        initializeCharacterCount();
        initializeFileUpload(); // Initialize file upload
        initializeFormSubmission();
        loadDraftData();

        // Make removeFileFromList globally accessible
        window.removeFileFromList = removeFileFromList;

        // Initialize Bootstrap tooltips
        initializeTooltips();
    }

    // --- Tooltip Initialization -----------------------------------------
    function initializeTooltips() {
        // Check if Bootstrap tooltips are available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    // --- Start when DOM is ready ----------------------------------------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
