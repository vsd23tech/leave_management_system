// Update Leave Screen JavaScript
class UpdateLeaveManager {
    constructor() {
        this.leaves = [];
        this.currentFilter = 'all';
        this.selectedLeave = null;
        this.init();
    }

    init() {
        // Set initial balances first
        this.updateBalancePreview();

        // Then load leaves and set up UI
        this.loadLeaves();
        this.setupEventListeners();
        this.checkGracePeriod();
        this.initializeTooltips();

        console.log('Initialization complete with balances:', this.balances);
    }

    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Modal event listeners
        document.getElementById('confirmUpdate').addEventListener('click', () => {
            this.showConfirmationModal();
        });

        document.getElementById('confirmUpdateLeave').addEventListener('click', () => {
            this.executeUpdate();
        });

        // Real-time balance validation - only when both fields have meaningful values
        document.getElementById('leaveTypeSelect').addEventListener('change', () => {
            // Delay validation slightly to ensure the form is properly updated
            setTimeout(() => this.validateCurrentFormBalance(), 100);
        });

        document.getElementById('leaveDuration').addEventListener('input', () => {
            // Only validate if leave type is also selected
            const leaveType = document.getElementById('leaveTypeSelect').value;
            if (leaveType) {
                this.validateCurrentFormBalance();
            }
        });

        // Date picker initialization
        this.initializeDatePickers();
    }

    validateCurrentFormBalance() {
        const leaveType = document.getElementById('leaveTypeSelect').value;
        const duration = parseInt(document.getElementById('leaveDuration').value) || 0;

        // Only validate if both fields have values and duration is reasonable
        if (!leaveType || duration === 0 || duration > 365) return;

        const validation = this.validateBalanceForNewLeave(leaveType, duration);
        this.showBalanceValidationMessage(validation);
    }

    showBalanceValidationMessage(validation) {
        // Remove existing validation message
        const existingMessage = document.querySelector('.balance-validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Only show validation message if there's a real validation error
        // Don't show "Invalid leave type" for dropdown options that are already filtered
        if (!validation.valid && validation.message !== 'Invalid leave type') {
            // Create and show validation message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'alert alert-danger balance-validation-message mt-2';
            messageDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${validation.message}
            `;

            // Insert after the duration field
            const durationField = document.getElementById('leaveDuration').closest('.col-md-6');
            durationField.appendChild(messageDiv);
        }
    }

    async loadLeaves() {
        // For development, using dummy data directly without API call
        this.leaves = this.getDummyLeaves();
        this.renderLeaves();

        // Don't call updateBalancePreview() here as it would reset balances
        // Only update the leave list display
    }

    getDummyLeaves() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        return [
            {
                id: 1,
                type: 'Sick Leave',
                startDate: tomorrow.toISOString().split('T')[0],
                endDate: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 3,
                status: 'approved',
                icon: 'fas fa-thermometer-half',
                color: 'secondary',
                reason: 'Medical appointment'
            },
            {
                id: 2,
                type: 'Earned Leave',
                startDate: nextWeek.toISOString().split('T')[0],
                endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 3,
                status: 'pending',
                icon: 'fas fa-calendar-check',
                color: 'primary',
                reason: 'Family vacation'
            },
            {
                id: 3,
                type: 'Casual Leave',
                startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 1,
                status: 'saved',
                icon: 'fas fa-umbrella-beach',
                color: 'info',
                reason: 'Personal appointment'
            },
            {
                id: 4,
                type: 'Maternity Leave',
                startDate: nextMonth.toISOString().split('T')[0],
                endDate: new Date(nextMonth.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 15,
                status: 'approved',
                icon: 'fas fa-baby',
                color: 'success',
                reason: 'Pregnancy and childbirth'
            },
            {
                id: 5,
                type: 'Paternity Leave',
                startDate: new Date(nextMonth.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(nextMonth.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 3,
                status: 'pending',
                icon: 'fas fa-user-friends',
                color: 'primary',
                reason: 'Support during partner pregnancy'
            },
            {
                id: 6,
                type: 'Unpaid Leave',
                startDate: new Date(nextMonth.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(nextMonth.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 1,
                status: 'saved',
                icon: 'fas fa-calendar-times',
                color: 'secondary',
                reason: 'Extended time off'
            }
        ];
    }

    renderLeaves() {
        const container = document.getElementById('leaveCardsContainer');
        const filteredLeaves = this.filterLeaves();

        console.log('Rendering leaves:', filteredLeaves.length, 'leaves');

        container.innerHTML = filteredLeaves.map(leave => this.createLeaveCard(leave)).join('');

        // Remove existing event listener to prevent duplicates
        if (this._clickHandler) {
            container.removeEventListener('click', this._clickHandler);
        }

        // Add click listeners to update buttons using event delegation
        this._clickHandler = (e) => {
            const updateBtn = e.target.closest('.update-btn');
            if (updateBtn) {
                const leaveId = parseInt(updateBtn.dataset.leaveId);
                console.log('Update button clicked for leave ID:', leaveId);
                this.selectLeaveForUpdate(leaveId);
            }
        };

        container.addEventListener('click', this._clickHandler);
        console.log('Leaves rendered successfully');
    }

    filterLeaves() {
        if (this.currentFilter === 'all') {
            return this.leaves;
        }
        return this.leaves.filter(leave => leave.status === this.currentFilter);
    }

    setActiveFilter(filter) {
        this.currentFilter = filter;

        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });

        this.renderLeaves();
    }

    createLeaveCard(leave) {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const today = new Date();
        const isToday = startDate.toDateString() === today.toDateString();
        const isPast = startDate < today;
        const canUpdate = !isPast || (isToday && this.isWithinGracePeriod());

        // Check if leave type can be modified
        const isEditable = this.isLeaveTypeEditable(leave.type);
        const canModify = canUpdate && isEditable;

        console.log(`Leave ${leave.id} (${leave.type}):`, {
            startDate: leave.startDate,
            endDate: leave.endDate,
            isToday,
            isPast,
            canUpdate,
            isEditable,
            canModify,
            gracePeriod: this.isWithinGracePeriod()
        });

        const statusText = {
            'approved': 'Approved',
            'pending': 'Pending for Approval',
            'saved': 'Saved'
        };

        const statusClass = {
            'approved': 'status-approved',
            'pending': 'status-pending',
            'saved': 'status-saved'
        };

        return `
            <div class="col-md-6 col-lg-3 mb-3">
                <div class="card leave-card h-100 ${!canModify ? 'not-editable' : ''}">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <div class="icon-${leave.color} me-2">
                                <i class="${leave.icon}"></i>
                            </div>
                            <h6 class="card-title mb-0">${leave.type}</h6>
                        </div>

                        <div class="leave-duration">
                            <i class="fas fa-calendar me-1"></i>
                            ${this.formatDateRange(startDate, endDate)}
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-light text-dark">
                                <i class="fas fa-clock me-1"></i>${leave.duration} day${leave.duration > 1 ? 's' : ''}
                            </span>
                            <span class="status-badge ${statusClass[leave.status]}">
                                ${statusText[leave.status]}
                            </span>
                        </div>

                                                ${canModify ?
                `<button class="btn btn-outline-primary update-btn" data-leave-id="${leave.id}">
                                <i class="fas fa-edit me-1"></i>Update Leave
                            </button>` : ''
            }
                    </div>
                </div>
            </div>
        `;
    }

    formatDateRange(startDate, endDate) {
        const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (startDate.toDateString() === endDate.toDateString()) {
            return start;
        }
        return `${start} - ${end}`;
    }

    selectLeaveForUpdate(leaveId) {
        console.log('selectLeaveForUpdate called with ID:', leaveId);
        this.selectedLeave = this.leaves.find(leave => leave.id === leaveId);

        if (!this.selectedLeave) {
            console.log('No leave found with ID:', leaveId);
            return;
        }

        console.log('Selected leave for update:', this.selectedLeave);

        // Populate the update modal
        this.populateUpdateModal();

        // Show the update modal
        const modal = new bootstrap.Modal(document.getElementById('updateLeaveModal'));
        modal.show();
    }

    populateUpdateModal() {
        const leave = this.selectedLeave;

        // Set current values
        document.getElementById('leaveTypeSelect').value = this.getLeaveTypeValue(leave.type);
        document.getElementById('leaveDuration').value = leave.duration;
        document.getElementById('startDate').value = leave.startDate;
        document.getElementById('endDate').value = leave.endDate;
        document.getElementById('leaveReason').value = leave.reason;

        // Update leave type options based on restrictions
        this.updateLeaveTypeOptions(leave.type);
    }

    getLeaveTypeValue(leaveType) {
        const mapping = {
            'Sick Leave': 'sick',
            'Earned Leave': 'earned',
            'Casual Leave': 'casual',
            'Unpaid Leave': 'unpaid',
            'Maternity Leave': 'maternity',
            'Paternity Leave': 'paternity',
            'Compensatory Off': 'compensatory',
            'Bereavement Leave': 'bereavement'
        };
        return mapping[leaveType] || '';
    }

    updateLeaveTypeOptions(currentType) {
        const select = document.getElementById('leaveTypeSelect');
        const options = select.querySelectorAll('option');

        options.forEach(option => {
            if (option.value === '') return; // Skip placeholder

            const canChange = this.canChangeLeaveType(currentType, option.value);
            option.disabled = !canChange;

            if (!canChange) {
                option.textContent += ' (Not allowed)';
            }
        });
    }

    canChangeLeaveType(fromType, toType) {
        // Define restriction rules
        const restrictions = {
            'Sick Leave': ['sick'], // Can only remain as Sick Leave
            'Maternity Leave': ['maternity'], // Can only remain as Maternity Leave
            'Paternity Leave': ['paternity'], // Can only remain as Paternity Leave
            'Bereavement Leave': ['bereavement'], // Can only remain as Bereavement Leave
            'Compensatory Off': ['compensatory'], // Can only remain as Compensatory Off
            'Casual Leave': ['casual', 'earned', 'unpaid'], // Can change to these types
            'Earned Leave': ['casual', 'earned', 'unpaid'], // Can change to these types
            'Unpaid Leave': ['casual', 'earned', 'unpaid'] // Can change to these types
        };

        const allowedTypes = restrictions[fromType] || [];
        return allowedTypes.includes(toType);
    }

    isLeaveTypeEditable(leaveType) {
        // Some leave types cannot be modified at all
        const nonEditableTypes = [
            'Sick Leave',
            'Maternity Leave',
            'Paternity Leave',
            'Bereavement Leave',
            'Compensatory Off'
        ];

        return !nonEditableTypes.includes(leaveType);
    }

    showConfirmationModal() {
        // Validate form
        if (!this.validateUpdateForm()) {
            return;
        }

        const leave = this.selectedLeave;
        const newType = document.getElementById('leaveTypeSelect').options[document.getElementById('leaveTypeSelect').selectedIndex].text;
        const newDuration = parseInt(document.getElementById('leaveDuration').value);
        const newStartDate = document.getElementById('startDate').value;
        const newEndDate = document.getElementById('endDate').value;
        const newReason = document.getElementById('leaveReason').value;

        // Create new leave object for comparison
        const newLeave = {
            type: newType,
            duration: newDuration,
            startDate: newStartDate,
            endDate: newEndDate,
            reason: newReason
        };

        // Calculate balance impact
        const balanceImpact = this.calculateBalanceImpact(leave, newLeave);
        const newBalances = this.updateBalancesForModification(balanceImpact);

        // Validate balance for new leave using updated balances
        const balanceValidation = this.validateBalanceForNewLeave(newType, newDuration, newBalances);

        // Debug: Log the calculation process
        console.log('=== BALANCE CALCULATION DEBUG ===');
        console.log('Original leave:', leave);
        console.log('New leave data:', newLeave);
        console.log('Current balances:', this.balances);
        console.log('Balance impact:', balanceImpact);
        console.log('New balances:', newBalances);
        console.log('Balance validation:', balanceValidation);

        // Check if there are actual changes
        const hasChanges = leave.type !== newType ||
            leave.duration !== newDuration ||
            leave.startDate !== newStartDate ||
            leave.endDate !== newEndDate ||
            leave.reason !== newReason;

        // Populate confirmation details (more compact)
        document.getElementById('updateConfirmationDetails').innerHTML = `
            <div class="row g-2">
                <div class="col-6">
                    <strong class="small text-muted">Current Leave Type:</strong><br>
                    <span class="text-muted">${leave.type}</span>
                </div>
                <div class="col-6">
                    <strong class="small text-muted">New Leave Type:</strong><br>
                    <span class="text-primary">${newType}</span>
                </div>
            </div>
            <div class="row g-2 mt-2">
                <div class="col-6">
                    <strong class="small text-muted">Current Duration:</strong><br>
                    <span class="text-muted">${leave.duration} days</span>
                </div>
                <div class="col-6">
                    <strong class="small text-muted">New Duration:</strong><br>
                    <span class="text-primary">${newDuration} days</span>
                </div>
            </div>
            <div class="row g-2 mt-2">
                <div class="col-6">
                    <strong class="small text-muted">Current Dates:</strong><br>
                    <span class="text-muted">${leave.startDate} to ${leave.endDate}</span>
                </div>
                <div class="col-6">
                    <strong class="small text-muted">New Dates:</strong><br>
                    <span class="text-primary">${newStartDate} to ${newEndDate}</span>
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-12">
                    <strong class="small text-muted">Reason for Change:</strong><br>
                    <span class="text-primary">${newReason}</span>
                </div>
            </div>
            ${hasChanges ? `
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card ${balanceValidation.valid ? 'bg-success-light border-success' : 'bg-danger-light border-danger'}">
                        <div class="card-body p-2">
                            <h6 class="card-title ${balanceValidation.valid ? 'text-success' : 'text-danger'} small mb-2">
                                <i class="fas ${balanceValidation.valid ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                                Balance Impact
                            </h6>
                            ${balanceValidation.valid ?
                    this.getBalanceImpactHTML(leave, newLeave, this.balances, newBalances) :
                    `<div class="text-danger small">
                                    <i class="fas fa-exclamation-triangle me-1"></i>
                                    ${balanceValidation.message}
                                </div>`
                }
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
        `;

        // Store the balance impact for later use
        this.pendingBalanceImpact = balanceImpact;
        this.pendingNewBalances = newBalances;
        this.pendingBalanceValidation = balanceValidation;

        // Show/hide approval warning based on whether there are changes
        const approvalWarning = document.getElementById('approvalWarning');
        if (approvalWarning) {
            approvalWarning.style.display = hasChanges ? 'block' : 'none';
        }

        // Hide update modal and show confirmation
        const updateModal = bootstrap.Modal.getInstance(document.getElementById('updateLeaveModal'));
        updateModal.hide();

        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();
    }

    validateUpdateForm() {
        const form = document.getElementById('updateLeaveForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        return true;
    }

    async executeUpdate() {
        try {
            console.log('=== EXECUTING LEAVE UPDATE ===');

            // Check if balance validation passed
            if (!this.pendingBalanceValidation.valid) {
                alert('Cannot proceed: ' + this.pendingBalanceValidation.message);
                return;
            }

            // Store current balances for rollback if needed
            const originalBalances = { ...this.balances };
            console.log('Original balances stored:', originalBalances);

            // Apply balance changes FIRST
            this.applyBalanceChanges();
            console.log('Balance changes applied');

            // Force update the display immediately
            this.displayBalances();
            console.log('Display updated with new balances');

            try {
                // Simulate API call
                await this.simulateUpdate();
                console.log('Leave update simulated successfully');

                // Update the leave in the leaves array
                const leaveIndex = this.leaves.findIndex(l => l.id === this.selectedLeave.id);
                if (leaveIndex !== -1) {
                    this.leaves[leaveIndex] = { ...this.selectedLeave };
                }

                // Hide confirmation modal
                const confirmationModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
                confirmationModal.hide();

                // Show success modal (which will show the updated balances)
                this.showSuccessModal();

                // Only re-render the leaves list without reloading data
                this.renderLeaves();

            } catch (error) {
                // If update fails, rollback the balance changes
                console.error('Update failed, rolling back balance changes');
                this.balances = { ...originalBalances };
                this.displayBalances();
                throw error;
            }

        } catch (error) {
            console.error('Update failed:', error);
            alert('Update failed. Please try again.');
        }
    }

    applyBalanceChanges() {
        if (!this.pendingBalanceImpact || !this.pendingNewBalances) {
            console.log('No balance impact to apply');
            return;
        }

        console.log('=== APPLYING BALANCE CHANGES ===');
        console.log('Pending impact:', this.pendingBalanceImpact);
        console.log('Pending new balances:', this.pendingNewBalances);
        console.log('Current balances before update:', this.balances);

        const impact = this.pendingBalanceImpact;
        const oldTypeKey = impact.oldType.key;
        const newTypeKey = impact.newType.key;

        // Update balances based on the impact
        if (oldTypeKey && impact.oldType.change > 0) {
            this.balances[oldTypeKey] += impact.oldType.change;
            console.log(`Added ${impact.oldType.change} days back to ${oldTypeKey}`);
        }

        if (newTypeKey && impact.newType.change < 0) {
            const daysToSubtract = Math.abs(impact.newType.change);
            this.balances[newTypeKey] -= daysToSubtract;
            console.log(`Subtracted ${daysToSubtract} days from ${newTypeKey}`);
        }

        // Force update the display
        this.displayBalances();

        // Add visual feedback for balance changes
        this.highlightBalanceChanges();

        console.log('=== BALANCE CHANGES APPLIED SUCCESSFULLY ===');
        console.log('Final balances:', this.balances);
    }

    updateSpecificChangedBalances() {
        if (!this.pendingBalanceImpact) return;

        const impact = this.pendingBalanceImpact;
        console.log('Updating specific changed balances:', impact);

        // Update old leave type balance (add back the days)
        if (impact.oldType.key && impact.oldType.change > 0) {
            const elementId = this.getBalanceElementIdFromKey(impact.oldType.key);
            const element = document.getElementById(elementId);
            if (element) {
                const currentBalance = parseInt(element.textContent) || 0;
                const newBalance = currentBalance + impact.oldType.change;
                element.textContent = newBalance;
                console.log(`Updated ${elementId}: ${currentBalance} → ${newBalance} (added back ${impact.oldType.change} days)`);

                // Visual feedback
                element.style.backgroundColor = '#d4edda';
                element.style.color = '#155724';
                setTimeout(() => {
                    element.style.backgroundColor = '';
                    element.style.color = '';
                }, 2000);
            }
        }

        // Update new leave type balance (subtract the days)
        if (impact.newType.key && impact.newType.change < 0) {
            const elementId = this.getBalanceElementIdFromKey(impact.newType.key);
            const element = document.getElementById(elementId);
            if (element) {
                const currentBalance = parseInt(element.textContent) || 0;
                const daysToSubtract = Math.abs(impact.newType.change);
                const newBalance = currentBalance - daysToSubtract;
                element.textContent = newBalance;
                console.log(`Updated ${elementId}: ${currentBalance} → ${newBalance} (subtracted ${daysToSubtract} days)`);

                // Visual feedback
                element.style.backgroundColor = '#f8d7da';
                element.style.color = '#721c24';
                setTimeout(() => {
                    element.style.backgroundColor = '';
                    element.style.color = '';
                }, 2000);
            }
        }
    }

    updateBalanceElementsDirectly() {
        // Only update the specific balance elements that actually changed
        if (!this.pendingBalanceImpact) return;

        const impact = this.pendingBalanceImpact;
        console.log('Updating only changed balance elements:', impact);

        // Update old leave type balance if it changed
        if (impact.oldType.key && impact.oldType.change > 0) {
            const elementId = this.getBalanceElementIdFromKey(impact.oldType.key);
            const element = document.getElementById(elementId);
            if (element) {
                const newBalance = this.balances[impact.oldType.key];
                element.textContent = newBalance;
                console.log(`Updated ${elementId} to ${newBalance}`);
            }
        }

        // Update new leave type balance if it changed
        if (impact.newType.key && impact.newType.change < 0) {
            const elementId = this.getBalanceElementIdFromKey(impact.newType.key);
            const element = document.getElementById(elementId);
            if (element) {
                const newBalance = this.balances[impact.newType.key];
                element.textContent = newBalance;
                console.log(`Updated ${elementId} to ${newBalance}`);
            }
        }
    }

    getBalanceElementIdFromKey(key) {
        // Map internal keys to DOM element IDs (same as cancel-leave.js)
        const mapping = {
            'sick': 'sickBalance',
            'earned': 'earnedBalance',
            'casual': 'casualBalance',
            'unpaid': 'unpaidBalance',
            'maternity': 'maternityBalance',
            'paternity': 'paternityBalance',
            'compensatory': 'compensatoryBalance',
            'bereavement': 'bereavementBalance'
        };

        return mapping[key] || `${key}Balance`;
    }

    refreshBalanceDisplay() {
        // Force update all balance elements
        Object.keys(this.balances).forEach(key => {
            const element = document.getElementById(`${key}Balance`);
            if (element) {
                element.textContent = this.balances[key];
                console.log(`Updated ${key}Balance display: ${this.balances[key]}`);
            }
        });

        // Add debug methods to window for troubleshooting
        window.debugBalanceUpdate = () => {
            console.log('=== DEBUG BALANCE UPDATE ===');
            console.log('Current balances:', this.balances);
            console.log('Pending impact:', this.pendingBalanceImpact);
            console.log('Pending new balances:', this.pendingNewBalances);
            console.log('Selected leave:', this.selectedLeave);

            // Test balance calculation
            if (this.selectedLeave) {
                const testNewLeave = {
                    type: document.getElementById('leaveTypeSelect').options[document.getElementById('leaveTypeSelect').selectedIndex].text,
                    duration: parseInt(document.getElementById('leaveDuration').value) || 0
                };

                console.log('Test new leave:', testNewLeave);
                const testImpact = this.calculateBalanceImpact(this.selectedLeave, testNewLeave);
                const testNewBalances = this.updateBalancesForModification(testImpact);
                console.log('Test impact:', testImpact);
                console.log('Test new balances:', testNewBalances);
            }
        };

        window.testBalanceUpdate = () => {
            console.log('Current balances:', this.balances);
            console.log('Testing balance update...');

            // Simulate updating Earned Leave from 3 days to 2 days
            const testOldLeave = { type: 'Earned Leave', duration: 3 };
            const testNewLeave = { type: 'Earned Leave', duration: 2 };

            const testImpact = this.calculateBalanceImpact(testOldLeave, testNewLeave);
            const testNewBalances = this.updateBalancesForModification(testImpact);

            console.log('Test impact:', testImpact);
            console.log('Test new balances:', testNewBalances);

            // Update and display
            this.balances = { ...testNewBalances };
            this.refreshBalanceDisplay();

            console.log('Test completed. Check the balance display above.');
        };

        // Method to manually trigger balance update for testing
        window.manualBalanceUpdate = () => {
            if (this.pendingBalanceImpact && this.pendingNewBalances) {
                console.log('Manually triggering balance update...');
                this.applyBalanceChanges();
            } else {
                console.log('No pending balance changes to apply');
            }
        };
    }

    getBalanceImpactHTML(oldLeave, newLeave, currentBalances, newBalances) {
        const oldTypeKey = this.getLeaveTypeKey(oldLeave.type);
        const newTypeKey = this.getLeaveTypeKey(newLeave.type);

        console.log('Generating balance impact HTML:', {
            oldLeave, newLeave, currentBalances, newBalances, oldTypeKey, newTypeKey
        });

        if (oldTypeKey === newTypeKey) {
            // Same leave type - show single balance change
            return `
                <div class="row">
                    <div class="col-12 text-center">
                        <strong>${oldLeave.type}:</strong><br>
                        <span class="text-muted">${currentBalances[oldTypeKey]} → <span class="text-success">${newBalances[oldTypeKey]}</span> days</span>
                    </div>
                </div>
            `;
        } else {
            // Different leave types - show both changes
            return `
                <div class="row">
                    <div class="col-6">
                        <strong>${oldLeave.type}:</strong><br>
                        <span class="text-muted">${currentBalances[oldTypeKey]} → <span class="text-success">${newBalances[oldTypeKey]}</span> days</span>
                    </div>
                    <div class="col-6">
                        <strong>${newLeave.type}:</strong><br>
                        <span class="text-muted">${currentBalances[newTypeKey]} → <span class="text-success">${newBalances[newTypeKey]}</span> days</span>
                    </div>
                </div>
            `;
        }
    }

    highlightBalanceChanges() {
        // Highlight the changed balance values briefly
        const impact = this.pendingBalanceImpact;

        if (impact.oldType.key) {
            const oldBalanceElement = document.getElementById(`${impact.oldType.key}Balance`);
            if (oldBalanceElement) {
                oldBalanceElement.style.transition = 'background-color 0.5s ease';
                oldBalanceElement.style.backgroundColor = 'var(--success-light)';
                setTimeout(() => {
                    oldBalanceElement.style.backgroundColor = '';
                }, 2000);
            }
        }

        if (impact.newType.key) {
            const newBalanceElement = document.getElementById(`${impact.newType.key}Balance`);
            if (newBalanceElement) {
                newBalanceElement.style.transition = 'background-color 0.5s ease';
                newBalanceElement.style.backgroundColor = 'var(--warning-light)';
                setTimeout(() => {
                    newBalanceElement.style.backgroundColor = '';
                }, 2000);
            }
        }
    }

    async simulateUpdate() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update the leave object
        const leave = this.selectedLeave;
        leave.type = document.getElementById('leaveTypeSelect').options[document.getElementById('leaveTypeSelect').selectedIndex].text;
        leave.duration = parseInt(document.getElementById('leaveDuration').value);
        leave.startDate = document.getElementById('startDate').value;
        leave.endDate = document.getElementById('endDate').value;
        leave.reason = document.getElementById('leaveReason').value;
        leave.status = 'pending'; // Reset to pending for re-approval

        console.log('Leave updated:', leave);
    }

    showSuccessModal() {
        const leave = this.selectedLeave;

        // Force update the balance display before showing modal
        this.displayBalances();

        // Populate leave details (more compact)
        document.getElementById('updatedLeaveDetails').innerHTML = `
            <div class="row g-2">
                <div class="col-6">
                    <strong class="small text-muted">Leave Type:</strong><br>
                    <span class="text-success">${leave.type}</span>
                </div>
                <div class="col-6">
                    <strong class="small text-muted">Duration:</strong><br>
                    <span class="text-success">${leave.duration} days</span>
                </div>
            </div>
            <div class="row g-2 mt-2">
                <div class="col-6">
                    <strong class="small text-muted">Start Date:</strong><br>
                    <span class="text-success">${leave.startDate}</span>
                </div>
                <div class="col-6">
                    <strong class="small text-muted">End Date:</strong><br>
                    <span class="text-success">${leave.endDate}</span>
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-12">
                    <strong class="small text-muted">Status:</strong><br>
                    <span class="badge bg-warning">Pending for Approval</span>
                </div>
            </div>
        `;

        // Populate balance details in separate section
        document.getElementById('updatedLeaveBalances').innerHTML = `
            <div class="row g-2">
                <div class="col-6">
                    <strong class="small text-muted">${this.pendingBalanceImpact.oldType.key ? this.getLeaveTypeName(this.pendingBalanceImpact.oldType.key) : 'N/A'}:</strong><br>
                    <span class="text-success fw-bold">${this.balances[this.pendingBalanceImpact.oldType.key] || 'N/A'} days</span>
                </div>
                <div class="col-6">
                    <strong class="small text-muted">${this.pendingBalanceImpact.newType.key ? this.getLeaveTypeName(this.pendingBalanceImpact.newType.key) : 'N/A'}:</strong><br>
                    <span class="text-success fw-bold">${this.balances[this.pendingBalanceImpact.newType.key] || 'N/A'} days</span>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();

        // Reset selection and pending data AFTER showing the modal
        setTimeout(() => {
            this.selectedLeave = null;
            this.pendingBalanceImpact = null;
            this.pendingNewBalances = null;
            this.pendingBalanceValidation = null;
        }, 100);
    }

    getLeaveTypeName(key) {
        const mapping = {
            'sick': 'Sick Leave',
            'earned': 'Earned Leave',
            'casual': 'Casual Leave',
            'unpaid': 'Unpaid Leave',
            'maternity': 'Maternity Leave',
            'paternity': 'Paternity Leave',
            'compensatory': 'Compensatory Off',
            'bereavement': 'Bereavement Leave'
        };
        return mapping[key] || key;
    }

    initializeDatePickers() {
        // Initialize start date picker
        flatpickr("#startDate", {
            dateFormat: "Y-m-d",
            minDate: "today",
            onChange: (selectedDates, dateStr) => {
                // Update end date picker min date
                if (selectedDates[0]) {
                    const endDatePicker = document.querySelector("#endDate")._flatpickr;
                    endDatePicker.set('minDate', selectedDates[0]);
                }
            }
        });

        // Initialize end date picker
        flatpickr("#endDate", {
            dateFormat: "Y-m-d",
            minDate: "today"
        });
    }

    checkGracePeriod() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if it's before 9:00 AM
        if (currentHour < 9 || (currentHour === 9 && currentMinute === 0)) {
            const warning = document.getElementById('gracePeriodWarning');
            const timeRemaining = document.querySelector('.time-remaining');

            if (warning && timeRemaining) {
                const minutesLeft = (9 * 60) - (currentHour * 60 + currentMinute);
                const hoursLeft = Math.floor(minutesLeft / 60);
                const minsLeft = minutesLeft % 60;

                if (hoursLeft > 0) {
                    timeRemaining.textContent = `${hoursLeft}h ${minsLeft}m`;
                } else {
                    timeRemaining.textContent = `${minsLeft}m`;
                }

                warning.style.display = 'block';
            }
        }
    }

    isWithinGracePeriod() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        return currentHour < 9 || (currentHour === 9 && currentMinute === 0);
    }

    updateBalancePreview() {
        // This would typically fetch from an API
        // For now, using static values
        this.balances = {
            sick: 15,
            earned: 20,
            casual: 10,
            unpaid: 30,
            maternity: 90,
            paternity: 15,
            compensatory: 5,
            bereavement: 7
        };

        console.log('Initial balances set:', this.balances);
        this.displayBalances();
    }

    displayBalances() {
        console.log('Updating balance display with:', this.balances);

        const balanceElements = {
            'sickBalance': this.balances.sick,
            'earnedBalance': this.balances.earned,
            'casualBalance': this.balances.casual,
            'unpaidBalance': this.balances.unpaid,
            'maternityBalance': this.balances.maternity,
            'paternityBalance': this.balances.paternity,
            'compensatoryBalance': this.balances.compensatory,
            'bereavementBalance': this.balances.bereavement
        };

        // Update each balance element
        Object.entries(balanceElements).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${elementId} to ${value}`);
            } else {
                console.warn(`Element ${elementId} not found in DOM`);
            }
        });

        console.log('Balance display update completed');
    }

    getLeaveTypeKey(leaveType) {
        const mapping = {
            'Sick Leave': 'sick',
            'Earned Leave': 'earned',
            'Casual Leave': 'casual',
            'Unpaid Leave': 'unpaid',
            'Maternity Leave': 'maternity',
            'Paternity Leave': 'paternity',
            'Compensatory Off': 'compensatory',
            'Bereavement Leave': 'bereavement'
        };
        return mapping[leaveType] || '';
    }

    calculateBalanceImpact(oldLeave, newLeave) {
        const oldTypeKey = this.getLeaveTypeKey(oldLeave.type);
        const newTypeKey = this.getLeaveTypeKey(newLeave.type);
        const oldDuration = oldLeave.duration;
        const newDuration = newLeave.duration;

        console.log('=== CALCULATING BALANCE IMPACT ===');
        console.log('Old leave:', oldLeave.type, oldDuration, 'days, key:', oldTypeKey);
        console.log('New leave:', newLeave.type, newDuration, 'days, key:', newTypeKey);

        const impact = {
            oldType: { key: oldTypeKey, change: +oldDuration }, // Add back old leave
            newType: { key: newTypeKey, change: -newDuration }, // Subtract new leave
            durationChange: newDuration - oldDuration
        };

        // If it's the same leave type, calculate net change
        if (oldTypeKey === newTypeKey) {
            const netChange = oldDuration - newDuration;
            impact.oldType.change = netChange > 0 ? netChange : 0; // Only add back if old duration was larger
            impact.newType.change = netChange < 0 ? Math.abs(netChange) : 0; // Only subtract if new duration is larger
            console.log('Same leave type - net change:', netChange);
        } else {
            console.log('Different leave types - add back:', oldDuration, 'to', oldTypeKey, ', subtract:', newDuration, 'from', newTypeKey);
        }

        console.log('Final impact:', impact);
        return impact;
    }

    updateBalancesForModification(impact) {
        const newBalances = { ...this.balances };

        console.log('=== UPDATING BALANCES ===');
        console.log('Current balances:', this.balances);
        console.log('Impact to apply:', impact);

        // Handle same leave type modification
        if (impact.oldType.key === impact.newType.key) {
            const key = impact.oldType.key;
            console.log(`Same leave type modification for ${key}`);

            if (impact.oldType.change > 0) {
                newBalances[key] += impact.oldType.change;
                console.log(`Same type - added ${impact.oldType.change} days back to ${key}: ${this.balances[key]} → ${newBalances[key]}`);
            }
            if (impact.newType.change > 0) {
                newBalances[key] -= impact.newType.change;
                console.log(`Same type - subtracted ${impact.newType.change} days from ${key}: ${newBalances[key]} → ${newBalances[key]}`);
            }
        } else {
            console.log('Different leave type modification');

            // Add back the old leave balance
            if (impact.oldType.key && impact.oldType.change > 0) {
                newBalances[impact.oldType.key] += impact.oldType.change;
                console.log(`Added ${impact.oldType.change} days back to ${impact.oldType.key}: ${this.balances[impact.oldType.key]} → ${newBalances[impact.oldType.key]}`);
            }

            // Subtract the new leave balance (impact.newType.change is negative)
            if (impact.newType.key && impact.newType.change < 0) {
                const daysToSubtract = Math.abs(impact.newType.change);
                newBalances[impact.newType.key] -= daysToSubtract;
                console.log(`Subtracted ${daysToSubtract} days from ${impact.newType.key}: ${this.balances[impact.newType.key]} → ${newBalances[impact.newType.key]}`);
            }
        }

        console.log('Final new balances:', newBalances);
        return newBalances;
    }

    validateBalanceForNewLeave(leaveType, duration, balancesToCheck = null) {
        const typeKey = this.getLeaveTypeKey(leaveType);
        if (!typeKey) {
            // Don't show "Invalid leave type" error for dropdown options that are already filtered
            // This usually means the leave type is still being processed or is a placeholder
            return { valid: true, message: 'Leave type processing' };
        }

        const balances = balancesToCheck || this.balances;
        const currentBalance = balances[typeKey];

        console.log(`Validating ${leaveType}: Available=${currentBalance}, Required=${duration}`);

        if (currentBalance < duration) {
            return {
                valid: false,
                message: `Insufficient ${leaveType} balance. Available: ${currentBalance} days, Required: ${duration} days`
            };
        }

        return { valid: true, message: 'Sufficient balance' };
    }

    initializeTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Initialize the update leave manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.updateLeaveManager = new UpdateLeaveManager();
});
