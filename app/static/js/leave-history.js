/* ==========================================================================
   Leave History Screen JavaScript
   - Leave balance display
   - Advanced filtering and search
   - Pagination
   - Export functionality (PDF/Excel)
   - Detailed view modals
   ========================================================================== */

class LeaveHistoryManager {
    constructor() {
        this.leaves = [];
        this.filteredLeaves = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchCriteria = {
            keyword: '',
            leaveType: '',
            dateFrom: '',
            dateTo: ''
        };
        this.balances = {};

        this.init();
    }

    init() {
        this.loadLeaveHistory();
        this.setupEventListeners();
        this.updateBalancePreview();
        this.initializeTooltips();

        console.log('Leave History Manager initialized');
    }

    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Search form
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.performSearch();
        });

        // Reset search
        document.getElementById('resetSearch').addEventListener('click', () => {
            this.resetSearch();
        });

        // Clear filters
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Export buttons
        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcel();
        });

        // Search inputs (real-time filtering)
        document.getElementById('searchKeyword').addEventListener('input', (e) => {
            this.searchCriteria.keyword = e.target.value;
            this.debounceSearch();
        });

        document.getElementById('leaveTypeFilter').addEventListener('change', (e) => {
            this.searchCriteria.leaveType = e.target.value;
            this.performSearch();
        });

        document.getElementById('dateFrom').addEventListener('change', (e) => {
            this.searchCriteria.dateFrom = e.target.value;
            this.performSearch();
        });

        document.getElementById('dateTo').addEventListener('change', (e) => {
            this.searchCriteria.dateTo = e.target.value;
            this.performSearch();
        });
    }

    async loadLeaveHistory() {
        try {
            // Simulate API call - replace with actual endpoint
            const response = await fetch('/api/leave/history');
            if (response.ok) {
                this.leaves = await response.json();
            } else {
                // Fallback to dummy data for development
                this.leaves = this.getDummyLeaveHistory();
            }
        } catch (error) {
            console.log('Using dummy data for development');
            this.leaves = this.getDummyLeaveHistory();
        }

        this.filteredLeaves = [...this.leaves];
        this.renderLeaveHistory();
        this.updatePagination();
    }

    getDummyLeaveHistory() {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastYear = new Date(today.getFullYear() - 1, 0, 1);

        return [
            {
                id: 1,
                type: 'Sick Leave',
                duration: 2,
                startDate: '2025-07-15',
                endDate: '2025-07-16',
                status: 'approved',
                reason: 'Medical appointment and recovery',
                appliedOn: '2025-07-10',
                approvedBy: 'John Manager',
                approvedOn: '2025-07-11',
                comments: 'Approved with medical certificate'
            },
            {
                id: 2,
                type: 'Earned Leave',
                duration: 5,
                startDate: '2025-08-01',
                endDate: '2025-08-05',
                status: 'approved',
                reason: 'Family vacation',
                appliedOn: '2025-07-20',
                approvedBy: 'John Manager',
                approvedOn: '2025-07-22',
                comments: 'Approved for family time'
            },
            {
                id: 3,
                type: 'Casual Leave',
                duration: 1,
                startDate: '2025-07-25',
                endDate: '2025-07-25',
                status: 'approved',
                reason: 'Personal appointment',
                appliedOn: '2025-07-23',
                approvedBy: 'John Manager',
                approvedOn: '2025-07-24',
                comments: 'Approved'
            },
            {
                id: 4,
                type: 'Maternity Leave',
                duration: 90,
                startDate: '2025-09-01',
                endDate: '2025-11-29',
                status: 'pending',
                reason: 'Pregnancy and childbirth',
                appliedOn: '2025-08-15',
                approvedBy: null,
                approvedOn: null,
                comments: 'Pending HR approval'
            },
            {
                id: 5,
                type: 'Unpaid Leave',
                duration: 3,
                startDate: '2025-06-10',
                endDate: '2025-06-12',
                status: 'rejected',
                reason: 'Extended personal time',
                appliedOn: '2025-06-05',
                approvedBy: 'John Manager',
                approvedOn: '2025-06-06',
                comments: 'Rejected due to project deadline'
            },
            {
                id: 6,
                type: 'Earned Leave',
                duration: 2,
                startDate: '2025-07-08',
                endDate: '2025-07-09',
                status: 'cancelled',
                reason: 'Weekend getaway',
                appliedOn: '2025-07-01',
                approvedBy: 'John Manager',
                approvedOn: '2025-07-02',
                comments: 'Cancelled due to change of plans'
            },
            {
                id: 7,
                type: 'Sick Leave',
                duration: 1,
                startDate: '2025-06-20',
                endDate: '2025-06-20',
                status: 'approved',
                reason: 'Not feeling well',
                appliedOn: '2025-06-20',
                approvedBy: 'John Manager',
                approvedOn: '2025-06-20',
                comments: 'Approved'
            },
            {
                id: 8,
                type: 'Casual Leave',
                duration: 1,
                startDate: '2025-06-15',
                endDate: '2025-06-15',
                status: 'approved',
                reason: 'Dentist appointment',
                appliedOn: '2025-06-12',
                approvedBy: 'John Manager',
                approvedOn: '2025-06-13',
                comments: 'Approved'
            },
            {
                id: 9,
                type: 'Earned Leave',
                duration: 3,
                startDate: '2025-05-20',
                endDate: '2025-05-22',
                status: 'approved',
                reason: 'Long weekend trip',
                appliedOn: '2025-05-15',
                approvedBy: 'John Manager',
                approvedOn: '2025-05-16',
                comments: 'Approved'
            },
            {
                id: 10,
                type: 'Compensatory Off',
                duration: 1,
                startDate: '2025-05-10',
                endDate: '2025-05-10',
                status: 'approved',
                reason: 'Overtime compensation',
                appliedOn: '2025-05-08',
                approvedBy: 'John Manager',
                approvedOn: '2025-05-09',
                comments: 'Approved for weekend work'
            },
            {
                id: 11,
                type: 'Bereavement Leave',
                duration: 3,
                startDate: '2025-04-15',
                endDate: '2025-04-17',
                status: 'approved',
                reason: 'Family bereavement',
                appliedOn: '2025-04-14',
                approvedBy: 'John Manager',
                approvedOn: '2025-04-14',
                comments: 'Approved with condolences'
            },
            {
                id: 12,
                type: 'Paternity Leave',
                duration: 5,
                startDate: '2025-03-20',
                endDate: '2025-03-24',
                status: 'approved',
                reason: 'Newborn care',
                appliedOn: '2025-03-18',
                approvedBy: 'John Manager',
                approvedOn: '2025-03-19',
                comments: 'Approved for new father'
            }
        ];
    }

    setActiveFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;

        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });

        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.leaves];

        // Apply status filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(leave => leave.status === this.currentFilter);
        }

        // Apply search criteria
        if (this.searchCriteria.keyword) {
            const keyword = this.searchCriteria.keyword.toLowerCase();
            filtered = filtered.filter(leave =>
                leave.type.toLowerCase().includes(keyword) ||
                leave.reason.toLowerCase().includes(keyword) ||
                leave.startDate.includes(keyword) ||
                leave.endDate.includes(keyword)
            );
        }

        if (this.searchCriteria.leaveType) {
            filtered = filtered.filter(leave =>
                leave.type.toLowerCase().includes(this.searchCriteria.leaveType.toLowerCase())
            );
        }

        if (this.searchCriteria.dateFrom) {
            filtered = filtered.filter(leave => leave.startDate >= this.searchCriteria.dateFrom);
        }

        if (this.searchCriteria.dateTo) {
            filtered = filtered.filter(leave => leave.endDate <= this.searchCriteria.dateTo);
        }

        this.filteredLeaves = filtered;
        this.renderLeaveHistory();
        this.updatePagination();
    }

    performSearch() {
        this.currentPage = 1;
        this.applyFilters();
    }

    resetSearch() {
        this.searchCriteria = {
            keyword: '',
            leaveType: '',
            dateFrom: '',
            dateTo: ''
        };

        // Reset form inputs
        document.getElementById('searchKeyword').value = '';
        document.getElementById('leaveTypeFilter').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';

        this.performSearch();
    }

    clearAllFilters() {
        this.setActiveFilter('all');
        this.resetSearch();
    }

    renderLeaveHistory() {
        const tbody = document.getElementById('leaveHistoryTableBody');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredLeaves.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageLeaves = this.filteredLeaves.slice(startIndex, endIndex);

        tbody.innerHTML = pageLeaves.map(leave => this.createLeaveRow(leave)).join('');

        // Add event listeners to action buttons
        this.setupRowEventListeners();
    }

    createLeaveRow(leave) {
        const statusClass = `status-${leave.status}`;
        const leaveTypeClass = `leave-type-${this.getLeaveTypeKey(leave.type)}`;

        return `
            <tr>
                <td>
                    <span class="leave-type-badge ${leaveTypeClass}">
                        <i class="${this.getLeaveTypeIcon(leave.type)}"></i>
                        ${leave.type}
                    </span>
                </td>
                <td>
                    <strong>${leave.duration}</strong> day${leave.duration > 1 ? 's' : ''}
                </td>
                <td>${this.formatDate(leave.startDate)}</td>
                <td>${this.formatDate(leave.endDate)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${this.getStatusText(leave.status)}
                    </span>
                </td>
                <td>${this.formatDate(leave.appliedOn)}</td>
                <td>
                    <button class="action-btn view-details" data-leave-id="${leave.id}" title="View Details">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }

    setupRowEventListeners() {
        // View details buttons
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const leaveId = parseInt(e.target.closest('.view-details').dataset.leaveId);
                this.showLeaveDetails(leaveId);
            });
        });
    }

    showLeaveDetails(leaveId) {
        const leave = this.leaves.find(l => l.id === leaveId);
        if (!leave) return;

        const content = document.getElementById('leaveDetailsContent');
        content.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card bg-light border-0">
                        <div class="card-body p-3">
                            <h6 class="card-title mb-2">Leave Information</h6>
                            <div class="row g-2">
                                <div class="col-6">
                                    <strong class="small text-muted">Leave Type:</strong><br>
                                    <span class="text-primary">${leave.type}</span>
                                </div>
                                <div class="col-6">
                                    <strong class="small text-muted">Duration:</strong><br>
                                    <span class="text-primary">${leave.duration} days</span>
                                </div>
                                <div class="col-6">
                                    <strong class="small text-muted">Start Date:</strong><br>
                                    <span class="text-primary">${this.formatDate(leave.startDate)}</span>
                                </div>
                                <div class="col-6">
                                    <strong class="small text-muted">End Date:</strong><br>
                                    <span class="text-primary">${this.formatDate(leave.endDate)}</span>
                                </div>
                                <div class="col-12">
                                    <strong class="small text-muted">Reason:</strong><br>
                                    <span class="text-primary">${leave.reason}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-light border-0">
                        <div class="card-body p-3">
                            <h6 class="card-title mb-2">Status & Approval</h6>
                            <div class="row g-2">
                                <div class="col-6">
                                    <strong class="small text-muted">Status:</strong><br>
                                    <span class="status-badge status-${leave.status}">
                                        ${this.getStatusText(leave.status)}
                                    </span>
                                </div>
                                <div class="col-6">
                                    <strong class="small text-muted">Applied On:</strong><br>
                                    <span class="text-primary">${this.formatDate(leave.appliedOn)}</span>
                                </div>
                                ${leave.approvedBy ? `
                                <div class="col-6">
                                    <strong class="small text-muted">Approved By:</strong><br>
                                    <span class="text-success">${leave.approvedBy}</span>
                                </div>
                                <div class="col-6">
                                    <strong class="small text-muted">Approved On:</strong><br>
                                    <span class="text-success">${this.formatDate(leave.approvedOn)}</span>
                                </div>
                                ` : ''}
                                ${leave.comments ? `
                                <div class="col-12">
                                    <strong class="small text-muted">Comments:</strong><br>
                                    <span class="text-muted">${leave.comments}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('leaveDetailsModal'));
        modal.show();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredLeaves.length / this.itemsPerPage);
        const paginationWrapper = document.getElementById('paginationWrapper');
        const pagination = document.getElementById('pagination');
        const showingStart = document.getElementById('showingStart');
        const showingEnd = document.getElementById('showingEnd');
        const totalRecords = document.getElementById('totalRecords');

        if (totalPages <= 1) {
            paginationWrapper.style.display = 'none';
            return;
        }

        paginationWrapper.style.display = 'flex';

        // Update info
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredLeaves.length);
        showingStart.textContent = start;
        showingEnd.textContent = end;
        totalRecords.textContent = this.filteredLeaves.length;

        // Generate pagination
        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">Next</a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;

        // Add event listeners
        pagination.querySelectorAll('.page-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.renderLeaveHistory();
                    this.updatePagination();
                }
            });
        });
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

        this.displayBalances();
    }

    displayBalances() {
        document.getElementById('sickBalance').textContent = this.balances.sick;
        document.getElementById('earnedBalance').textContent = this.balances.earned;
        document.getElementById('casualBalance').textContent = this.balances.casual;
        document.getElementById('unpaidBalance').textContent = this.balances.unpaid;
        document.getElementById('maternityBalance').textContent = this.balances.maternity;
        document.getElementById('paternityBalance').textContent = this.balances.paternity;
        document.getElementById('compensatoryBalance').textContent = this.balances.compensatory;
        document.getElementById('bereavementBalance').textContent = this.balances.bereavement;
    }

    exportToPDF() {
        // Simulate PDF export
        console.log('Exporting to PDF...');
        alert('PDF export functionality will be implemented here. This would generate a PDF report of the current filtered leave history.');
    }

    exportToExcel() {
        // Simulate Excel export
        console.log('Exporting to Excel...');
        alert('Excel export functionality will be implemented here. This would generate an Excel file of the current filtered leave history.');
    }

    // Utility functions
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
        return mapping[leaveType] || 'other';
    }

    getLeaveTypeIcon(leaveType) {
        const mapping = {
            'Sick Leave': 'fas fa-thermometer-half',
            'Earned Leave': 'fas fa-calendar-check',
            'Casual Leave': 'fas fa-umbrella-beach',
            'Unpaid Leave': 'fas fa-calendar-times',
            'Maternity Leave': 'fas fa-baby',
            'Paternity Leave': 'fas fa-user-friends',
            'Compensatory Off': 'fas fa-clock',
            'Bereavement Leave': 'fas fa-heart-broken'
        };
        return mapping[leaveType] || 'fas fa-calendar';
    }

    getStatusText(status) {
        const mapping = {
            'approved': 'Approved',
            'pending': 'Pending',
            'rejected': 'Rejected',
            'cancelled': 'Cancelled',
            'saved': 'Saved'
        };
        return mapping[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    initializeTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Initialize the leave history manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.leaveHistoryManager = new LeaveHistoryManager();
});
