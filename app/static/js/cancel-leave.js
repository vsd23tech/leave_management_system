// Cancel Leave Screen JavaScript
class CancelLeaveManager {
    constructor() {
        this.leaves = [];
        this.currentFilter = 'all';
        this.selectedLeave = null;
        this.selectedDates = [];
        this.init();
    }

    init() {
        this.loadLeaves();
        this.setupEventListeners();
        this.checkGracePeriod();
        this.initializeTooltips();
    }

    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Modal event listeners
        document.getElementById('fullCancellation').addEventListener('click', () => {
            this.handleFullCancellation();
        });

        document.getElementById('partialCancellation').addEventListener('click', () => {
            this.handlePartialCancellation();
        });

        document.getElementById('confirmCancellation').addEventListener('click', () => {
            this.executeCancellation();
        });

        document.getElementById('confirmPartialCancellation').addEventListener('click', () => {
            this.executePartialCancellation();
        });
    }

    async loadLeaves() {
        try {
            // Simulate API call - replace with actual endpoint
            const response = await fetch('/api/leave/list');
            if (response.ok) {
                this.leaves = await response.json();
            } else {
                // Fallback to dummy data for development
                this.leaves = this.getDummyLeaves();
            }
        } catch (error) {
            console.log('Using dummy data for development');
            this.leaves = this.getDummyLeaves();
        }

        this.renderLeaves();
        this.updateBalancePreview();
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
                startDate: tomorrow.toISOString().split('T')[0], // Tomorrow
                endDate: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from tomorrow
                duration: 3,
                status: 'approved',
                icon: 'fas fa-thermometer-half',
                color: 'secondary'
            },
            {
                id: 2,
                type: 'Earned Leave',
                startDate: nextWeek.toISOString().split('T')[0], // Next week
                endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from next week
                duration: 3,
                status: 'pending',
                icon: 'fas fa-calendar-check',
                color: 'primary'
            },
            {
                id: 3,
                type: 'Casual Leave',
                startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from today
                endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Same day
                duration: 1,
                status: 'saved',
                icon: 'fas fa-umbrella-beach',
                color: 'info'
            },
            {
                id: 4,
                type: 'Maternity Leave',
                startDate: nextMonth.toISOString().split('T')[0], // Next month
                endDate: new Date(nextMonth.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from next month
                duration: 15,
                status: 'approved',
                icon: 'fas fa-baby',
                color: 'success'
            },
            {
                id: 5,
                type: 'Paternity Leave',
                startDate: new Date(nextMonth.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days after next month
                endDate: new Date(nextMonth.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days after next month
                duration: 3,
                status: 'pending',
                icon: 'fas fa-user-friends',
                color: 'primary'
            },
            {
                id: 6,
                type: 'Unpaid Leave',
                startDate: new Date(nextMonth.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days after next month
                endDate: new Date(nextMonth.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Same day
                duration: 1,
                status: 'saved',
                icon: 'fas fa-calendar-times',
                color: 'secondary'
            }
        ];
    }

    renderLeaves() {
        const container = document.getElementById('leaveCardsContainer');
        const filteredLeaves = this.filterLeaves();

        console.log('Rendering leaves:', filteredLeaves.length, 'leaves');
        console.log('Leaves array:', this.leaves);

        container.innerHTML = filteredLeaves.map(leave => this.createLeaveCard(leave)).join('');

        // Remove existing event listener to prevent duplicates
        if (this._clickHandler) {
            container.removeEventListener('click', this._clickHandler);
        }

        // Add click listeners to cancel buttons using event delegation
        this._clickHandler = (e) => {
            const cancelBtn = e.target.closest('.cancel-btn');
            if (cancelBtn) {
                const leaveId = parseInt(cancelBtn.dataset.leaveId);
                console.log('Cancel button clicked for leave ID:', leaveId);
                this.selectLeaveForCancellation(leaveId);
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
        const canCancel = !isPast || (isToday && this.isWithinGracePeriod());

        console.log(`Leave ${leave.id} (${leave.type}):`, {
            startDate: leave.startDate,
            endDate: leave.endDate,
            isToday,
            isPast,
            canCancel,
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

        // Check if this leave has been partially cancelled
        const isPartiallyCancelled = leave.originalDuration && leave.originalDuration > leave.duration;

        return `
            <div class="col-md-6 col-lg-3 mb-3">
                <div class="card leave-card h-100 ${isPartiallyCancelled ? 'partially-cancelled' : ''}">
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

                        ${isPartiallyCancelled ?
                `<div class="text-warning small text-center mb-2">
                                <i class="fas fa-exclamation-triangle me-1"></i>
                                <strong>Leave cancelled partially</strong>
                            </div>` : ''
            }

                        ${canCancel ?
                `<button class="btn btn-outline-danger cancel-btn" data-leave-id="${leave.id}">
                                <i class="fas fa-times me-1"></i>Cancel Leave
                            </button>` :
                `<div class="text-muted small text-center mt-2">
                                <i class="fas fa-info-circle me-1"></i>
                                ${isPast ? 'Past leave cannot be cancelled' : 'Cancellation time expired'}
                            </div>`
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

    selectLeaveForCancellation(leaveId) {
        console.log('selectLeaveForCancellation called with ID:', leaveId);
        this.selectedLeave = this.leaves.find(leave => leave.id === leaveId);

        if (!this.selectedLeave) {
            console.log('No leave found with ID:', leaveId);
            return;
        }

        console.log('Selected leave:', this.selectedLeave);

        // Check if it's a multi-day leave
        const startDate = new Date(this.selectedLeave.startDate);
        const endDate = new Date(this.selectedLeave.endDate);
        const isMultiDay = startDate.toDateString() !== endDate.toDateString();

        console.log('Is multi-day:', isMultiDay, 'Duration:', this.selectedLeave.duration);

        if (isMultiDay && this.selectedLeave.duration > 1) {
            // Show cancellation type modal
            console.log('Showing cancellation type modal');
            const modal = new bootstrap.Modal(document.getElementById('cancellationTypeModal'));
            modal.show();
        } else {
            // Direct to confirmation for single day
            console.log('Showing confirmation modal directly');
            this.showConfirmationModal();
        }
    }

    handleFullCancellation() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancellationTypeModal'));
        modal.hide();
        this.showConfirmationModal();
    }

    handlePartialCancellation() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancellationTypeModal'));
        modal.hide();
        this.showPartialCancellationModal();
    }

    showConfirmationModal() {
        const leave = this.selectedLeave;
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        document.getElementById('confirmationDetails').innerHTML = `
            <div class="row">
                <div class="col-6">
                    <strong>Leave Type:</strong><br>
                    ${leave.type}
                </div>
                <div class="col-6">
                    <strong>Duration:</strong><br>
                    ${leave.duration} day${leave.duration > 1 ? 's' : ''}
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-6">
                    <strong>Start Date:</strong><br>
                    ${startDate.toLocaleDateString()}
                </div>
                <div class="col-6">
                    <strong>End Date:</strong><br>
                    ${endDate.toLocaleDateString()}
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-12">
                    <strong>Status:</strong><br>
                    <span class="status-badge ${this.getStatusClass(leave.status)}">
                        ${this.getStatusText(leave.status)}
                    </span>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();
    }

    showPartialCancellationModal() {
        const leave = this.selectedLeave;
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const today = new Date();

        document.getElementById('partialLeavePeriod').textContent =
            `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        document.getElementById('currentTime').textContent =
            today.toLocaleString();

        // Generate date selection grid
        const dateGrid = document.getElementById('dateSelectionGrid');
        dateGrid.innerHTML = '';

        const currentDate = new Date(startDate);
        let hasTodayLeave = false;

        while (currentDate <= endDate) {
            const isToday = currentDate.toDateString() === today.toDateString();
            const isPast = currentDate < today;
            const canCancel = !isPast || (isToday && this.isWithinGracePeriod());

            if (isToday) hasTodayLeave = true;

            const dateCard = document.createElement('div');
            dateCard.className = 'col-md-3 col-6 mb-2';
            dateCard.innerHTML = `
                <div class="card date-selection-card ${canCancel ? 'cursor-pointer' : 'opacity-50'}"
                     data-date="${currentDate.toISOString().split('T')[0]}"
                     ${canCancel ? 'onclick="cancelLeaveManager.toggleDateSelection(this)"' : ''}>
                    <div class="card-body text-center p-2">
                        <div class="fw-bold">${currentDate.getDate()}</div>
                        <div class="small text-muted">${currentDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        ${isToday ? '<div class="badge bg-warning text-dark small">Today</div>' : ''}
                        ${!canCancel ? '<div class="text-muted small">Cannot Cancel</div>' : ''}
                    </div>
                </div>
            `;

            dateGrid.appendChild(dateCard);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Show grace period warning if today's leave is included
        const graceAlert = document.getElementById('gracePeriodAlert');
        if (hasTodayLeave && !this.isWithinGracePeriod()) {
            graceAlert.style.display = 'block';
        } else {
            graceAlert.style.display = 'none';
        }

        const modal = new bootstrap.Modal(document.getElementById('partialCancellationModal'));
        modal.show();
    }

    toggleDateSelection(dateCard) {
        const date = dateCard.dataset.date;
        const isSelected = dateCard.classList.contains('selected');

        if (isSelected) {
            dateCard.classList.remove('selected', 'bg-primary', 'text-white');
            this.selectedDates = this.selectedDates.filter(d => d !== date);
        } else {
            dateCard.classList.add('selected', 'bg-primary', 'text-white');
            this.selectedDates.push(date);
        }

        // Update partial cancellation summary
        this.updatePartialCancellationSummary();
    }

    updatePartialCancellationSummary() {
        if (this.selectedDates.length === 0) {
            document.getElementById('partialCancellationSummary').style.display = 'none';
            return;
        }

        const leave = this.selectedLeave;
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        // Calculate remaining dates after cancellation
        const remainingDates = this.calculateRemainingDates(startDate, endDate, this.selectedDates);

        // Update summary display
        document.getElementById('datesToCancel').textContent =
            this.selectedDates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ');

        document.getElementById('remainingLeave').textContent =
            remainingDates.length > 0
                ? `${remainingDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${remainingDates[remainingDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${remainingDates.length} days)`
                : 'No remaining leave';

        document.getElementById('partialCancellationSummary').style.display = 'block';
    }

    calculateRemainingDates(startDate, endDate, cancelledDates) {
        const remainingDates = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            if (!cancelledDates.includes(dateString)) {
                remainingDates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return remainingDates;
    }

    updateLeaveForPartialCancellation(cancelledDays) {
        const leave = this.selectedLeave;
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        // Store original duration for visual indication
        if (!leave.originalDuration) {
            leave.originalDuration = leave.duration;
        }

        // Calculate remaining dates after cancellation
        const remainingDates = this.calculateRemainingDates(startDate, endDate, this.selectedDates);

        if (remainingDates.length > 0) {
            // Update the leave with new dates and duration
            leave.startDate = remainingDates[0].toISOString().split('T')[0];
            leave.endDate = remainingDates[remainingDates.length - 1].toISOString().split('T')[0];
            leave.duration = remainingDates.length;

            console.log('Leave updated for partial cancellation:', {
                originalDuration: leave.originalDuration,
                newStartDate: leave.startDate,
                newEndDate: leave.endDate,
                newDuration: leave.duration
            });
        } else {
            // All dates cancelled - remove the leave
            this.leaves = this.leaves.filter(l => l.id !== leave.id);
            console.log('All dates cancelled, leave removed');
        }
    }

    async executeCancellation() {
        try {
            console.log('executeCancellation called');

            // Simulate API call
            await this.simulateCancellation();

            // Real-time update: Remove the cancelled leave and refresh display FIRST
            console.log('Calling removeCancelledLeave...');
            this.removeCancelledLeave();

            // Show success modal AFTER updating the display
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            modal.hide();

            this.showSuccessModal();

        } catch (error) {
            console.error('Cancellation failed:', error);
            alert('Cancellation failed. Please try again.');
        }
    }

    async executePartialCancellation() {
        if (this.selectedDates.length === 0) {
            alert('Please select at least one date to cancel.');
            return;
        }

        try {
            console.log('executePartialCancellation called');

            // Simulate API call
            await this.simulatePartialCancellation();

            // Real-time update: Remove the cancelled leave or update it FIRST
            console.log('Calling removeCancelledLeave for partial cancellation...');
            this.removeCancelledLeave();

            // Show success modal AFTER updating the display
            const modal = bootstrap.Modal.getInstance(document.getElementById('partialCancellationModal'));
            modal.hide();

            this.showSuccessModal();

        } catch (error) {
            console.error('Partial cancellation failed:', error);
            alert('Partial cancellation failed. Please try again.');
        }
    }

    async simulateCancellation() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Don't modify the leaves array here - let removeCancelledLeave handle it
        console.log('Simulation completed for leave ID:', this.selectedLeave.id);
    }

    async simulatePartialCancellation() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Don't modify the leaves array here - let removeCancelledLeave handle it
        console.log('Partial simulation completed for leave ID:', this.selectedLeave.id);
    }

    updateBalanceAfterCancellation(cancelledDays) {
        // Update the balance preview
        const leaveType = this.selectedLeave.type; // Don't convert to lowercase
        const balanceElement = document.getElementById(this.getBalanceElementId(leaveType));

        console.log('Updating balance for:', leaveType);
        console.log('Balance element:', balanceElement);
        console.log('Current balance text:', balanceElement ? balanceElement.textContent : 'null');
        console.log('Cancelled days:', cancelledDays);

        if (balanceElement) {
            const currentBalance = parseInt(balanceElement.textContent);
            if (!isNaN(currentBalance)) {
                const newBalance = currentBalance + cancelledDays;
                balanceElement.textContent = newBalance;
                console.log('Balance updated from', currentBalance, 'to', newBalance);

                // Add visual feedback - briefly highlight the updated balance
                balanceElement.style.backgroundColor = '#d4edda';
                balanceElement.style.color = '#155724';
                balanceElement.style.borderRadius = '4px';
                balanceElement.style.padding = '2px 6px';

                setTimeout(() => {
                    balanceElement.style.backgroundColor = '';
                    balanceElement.style.color = '';
                    balanceElement.style.borderRadius = '';
                    balanceElement.style.padding = '';
                }, 2000);

            } else {
                console.log('Could not parse current balance:', balanceElement.textContent);
            }
        } else {
            console.log('Balance element not found for:', leaveType);
        }
    }

    removeCancelledLeave() {
        if (!this.selectedLeave) return;

        console.log('removeCancelledLeave called with leave:', this.selectedLeave);

        const cancelledDays = this.selectedDates.length > 0 ? this.selectedDates.length : this.selectedLeave.duration;
        console.log('Cancelled days:', cancelledDays);

        // Store the original balance BEFORE updating it
        const leaveType = this.selectedLeave.type;
        const balanceElement = document.getElementById(this.getBalanceElementId(leaveType));
        const originalBalance = balanceElement ? parseInt(balanceElement.textContent) : 0;
        this.selectedLeave.originalBalance = originalBalance;

        console.log('Original balance stored:', originalBalance);

        // Update the leave balance in real-time
        this.updateBalanceAfterCancellation(cancelledDays);

        // Handle partial vs full cancellation
        if (cancelledDays >= this.selectedLeave.duration) {
            // Full cancellation - remove the leave
            this.leaves = this.leaves.filter(leave => leave.id !== this.selectedLeave.id);
            console.log('Leave fully cancelled, removed from array. Remaining leaves:', this.leaves.length);
        } else {
            // Partial cancellation - update the leave with new dates and duration
            this.updateLeaveForPartialCancellation(cancelledDays);
            console.log('Partial cancellation completed, leave updated');
        }

        // Re-render the leaves to show the updated state
        this.renderLeaves();

        // Show a success message
        this.showSuccessToast();
    }

    showSuccessToast() {
        // Create a simple success notification
        const toast = document.createElement('div');
        toast.className = 'alert alert-success position-fixed';
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            <strong>Leave cancelled successfully!</strong>
            <br>
            <small>Your leave balance has been updated.</small>
        `;

        document.body.appendChild(toast);

        // Remove the toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getBalanceElementId(leaveType) {
        console.log('getBalanceElementId called with:', leaveType);

        const mapping = {
            'Sick Leave': 'sickBalance',
            'Earned Leave': 'earnedBalance',
            'Casual Leave': 'casualBalance',
            'Unpaid Leave': 'unpaidBalance',
            'Maternity Leave': 'maternityBalance',
            'Paternity Leave': 'paternityBalance',
            'Compensatory Off': 'compensatoryBalance',
            'Bereavement Leave': 'bereavementBalance'
        };

        const elementId = mapping[leaveType] || 'sickBalance';

        console.log('Mapped to element ID:', elementId);

        return elementId;
    }

    showSuccessModal() {
        const leave = this.selectedLeave;
        const cancelledDays = this.selectedDates.length > 0 ? this.selectedDates.length : leave.duration;

        // Use the stored original balance instead of current balance
        const originalBalance = leave.originalBalance || 0;
        const newBalance = originalBalance + cancelledDays;

        console.log('Success modal calculation:', {
            originalBalance,
            cancelledDays,
            newBalance
        });

        document.getElementById('updatedBalanceDetails').innerHTML = `
            <div class="row">
                <div class="col-6">
                    <strong>${leave.type}:</strong><br>
                    <span class="text-success">+${cancelledDays} days</span>
                </div>
                <div class="col-6">
                    <strong>New Balance:</strong><br>
                    <span class="text-success">${newBalance} days</span>
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-12">
                    <strong>Total Cancelled:</strong><br>
                    <span class="text-success">${cancelledDays} day${cancelledDays > 1 ? 's' : ''}</span>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();

        // Reset selection
        this.selectedLeave = null;
        this.selectedDates = [];
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

    getStatusText(status) {
        const statusText = {
            'approved': 'Approved',
            'pending': 'Pending for Approval',
            'saved': 'Saved'
        };
        return statusText[status] || status;
    }

    getStatusClass(status) {
        const statusClass = {
            'approved': 'status-approved',
            'pending': 'status-pending',
            'saved': 'status-saved'
        };
        return statusClass[status] || '';
    }

    updateBalancePreview() {
        // This would typically fetch from an API
        // For now, using static values
        const balances = {
            sick: 15,
            earned: 20,
            casual: 10,
            unpaid: 30,
            maternity: 90,
            paternity: 15,
            compensatory: 5,
            bereavement: 7
        };

        document.getElementById('sickBalance').textContent = balances.sick;
        document.getElementById('earnedBalance').textContent = balances.earned;
        document.getElementById('casualBalance').textContent = balances.casual;
        document.getElementById('unpaidBalance').textContent = balances.unpaid;
        document.getElementById('maternityBalance').textContent = balances.maternity;
        document.getElementById('paternityBalance').textContent = balances.paternity;
        document.getElementById('compensatoryBalance').textContent = balances.compensatory;
        document.getElementById('bereavementBalance').textContent = balances.bereavement;
    }

    initializeTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Cancel Leave JavaScript loaded');
    window.cancelLeaveManager = new CancelLeaveManager();
});

// Add cursor pointer style for clickable elements
document.addEventListener('DOMContentLoaded', function () {
    const style = document.createElement('style');
    style.textContent = `
        .cursor-pointer {
            cursor: pointer;
        }
        .date-selection-card.selected {
            background-color: var(--brand-primary) !important;
            color: white !important;
        }
    `;
    document.head.appendChild(style);
});
