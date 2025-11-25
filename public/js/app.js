// State
let currentCompanyId = null;
let isTenantMode = false;

// DOM Elements
const createCompanyForm = document.getElementById('create-company-form');
const companiesListSection = document.getElementById('companies-list-section');
const companyDetailSection = document.getElementById('company-detail-section');
const createCompanySection = document.getElementById('create-company-section');
const companiesContainer = document.getElementById('companies-container');
const addUserForm = document.getElementById('add-user-form');
const usersListContainer = document.getElementById('users-list-container');
const backToListBtn = document.getElementById('back-to-list');
const createMessage = document.getElementById('create-message');

// API URL
// Empty string means relative to current origin (works for both admin and tenant subdomains)
const API_URL = '';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    checkTenantMode();
});

// --- Functions ---

function checkTenantMode() {
    const host = window.location.hostname;
    const parts = host.split('.');
    
    let subdomain = null;
    if (host.includes('localhost')) {
        if (parts.length >= 2) subdomain = parts[0];
    } else {
        if (parts.length >= 3) subdomain = parts[0];
    }

    if (subdomain && subdomain !== 'www') {
        // Tenant Mode
        isTenantMode = true;
        console.log('Tenant Mode detected:', subdomain);
        initTenantMode(subdomain);
    } else {
        // Admin Mode
        isTenantMode = false;
        console.log('Admin Mode');
        loadCompanies();
    }
}

function initTenantMode(subdomain) {
    // Hide admin sections
    createCompanySection.classList.add('hidden');
    companiesListSection.classList.add('hidden');
    companyDetailSection.classList.remove('hidden');
    
    // Customize UI for tenant
    document.getElementById('back-to-list').style.display = 'none';
    document.querySelector('.company-info').innerHTML = `
        <h3>Tenant: ${subdomain}</h3>
        <p>Accessing via subdomain isolation.</p>
    `;
    
    // Don't set currentCompanyId in tenant mode - it's not needed
    loadTenantUsers();
    
    // Update Add User form handler
    addUserForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(addUserForm);
        const data = {
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName')
        };

        try {
            const response = await fetch(`${API_URL}/users`, { // Direct /users endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add user');
            }

            addUserForm.reset();
            loadTenantUsers();
        } catch (error) {
            alert('Error adding user: ' + error.message);
        }
    };
}

async function loadTenantUsers() {
    try {
        usersListContainer.innerHTML = '<p>Loading users...</p>';
        // Call /users endpoint which uses the subdomain from the request host
        const response = await fetch(`${API_URL}/users`); 
        
        if (!response.ok) throw new Error('Failed to load users');

        const users = await response.json();
        renderUsers(users, true); // true for tenant mode (different delete logic)
    } catch (error) {
        usersListContainer.innerHTML = '<p class="error">Error loading users. Make sure the tenant exists.</p>';
        console.error(error);
    }
}

// Modified renderUsers to handle delete in tenant mode
function renderUsers(users, isTenantMode = false) {
    if (users.length === 0) {
        usersListContainer.innerHTML = '<p>No users found.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(user => {
        const deleteOnClick = isTenantMode 
            ? `deleteTenantUser('${user.id}')` 
            : `deleteUser('${user.id}')`;
            
        html += `
            <tr>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.firstName || '-')}</td>
                <td>${escapeHtml(user.lastName || '-')}</td>
                <td>
                    <button class="btn-icon" onclick="${deleteOnClick}">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    usersListContainer.innerHTML = html;
}

async function deleteTenantUser(userId) {
    if (!confirm('Are you sure?')) return;
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete');
        loadTenantUsers();
    } catch (error) {
        alert(error.message);
    }
}

// Original loadCompanies...
createCompanyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(createCompanyForm);
    const data = {
        name: formData.get('name'),
        slug: formData.get('slug')
    };

    try {
        const response = await fetch(`${API_URL}/companies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create company');

        showMessage('Company created successfully!', 'success');
        createCompanyForm.reset();
        loadCompanies();
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

backToListBtn.addEventListener('click', () => {
    showList();
});

addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Skip if tenant mode (tenant mode has its own handler)
    if (isTenantMode) return;
    
    if (!currentCompanyId) return;

    const formData = new FormData(addUserForm);
    const data = {
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName')
    };

    try {
        const response = await fetch(`${API_URL}/companies/${currentCompanyId}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add user');
        }

        addUserForm.reset();
        loadUsers(currentCompanyId);
    } catch (error) {
        alert('Error adding user: ' + error.message);
    }
});

// --- Functions ---

async function loadCompanies() {
    try {
        companiesContainer.innerHTML = '<p>Loading...</p>';
        const response = await fetch(`${API_URL}/companies`);
        const companies = await response.json();

        renderCompanies(companies);
    } catch (error) {
        companiesContainer.innerHTML = '<p class="error">Error loading companies.</p>';
        console.error(error);
    }
}

function renderCompanies(companies) {
    companiesContainer.innerHTML = '';
    
    if (companies.length === 0) {
        companiesContainer.innerHTML = '<p>No companies found.</p>';
        return;
    }

    companies.forEach(company => {
        const card = document.createElement('div');
        card.className = 'company-card';
        // card.onclick = () => showCompanyDetail(company);
        
        // Open subdomain in new tab
        const port = window.location.port ? `:${window.location.port}` : '';
        const tenantUrl = `${window.location.protocol}//${company.slug}.localhost${port}`;
        
        card.innerHTML = `
            <h3>${escapeHtml(company.name)}</h3>
            <p>Slug: ${escapeHtml(company.slug)}</p>
            <p>Schema: ${escapeHtml(company.schemaName)}</p>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button class="btn-secondary" onclick="showCompanyDetail(${JSON.stringify(company).replace(/"/g, '&quot;')}); event.stopPropagation();">Admin View</button>
                <a href="${tenantUrl}" target="_blank" class="btn-primary" style="text-decoration: none; text-align: center; display: inline-block; font-size: 0.9rem; padding: 0.5rem 1rem;" onclick="event.stopPropagation();">Open App</a>
            </div>
        `;
        
        companiesContainer.appendChild(card);
    });
}

function showCompanyDetail(company) {
    currentCompanyId = company.id;
    
    // Update UI
    document.getElementById('detail-company-name').textContent = company.name;
    document.getElementById('detail-company-id').textContent = company.id;
    document.getElementById('detail-company-slug').textContent = company.slug;
    document.getElementById('detail-company-schema').textContent = company.schemaName;

    // Toggle sections
    createCompanySection.classList.add('hidden');
    companiesListSection.classList.add('hidden');
    companyDetailSection.classList.remove('hidden');

    // Load users
    loadUsers(company.id);
}

function showList() {
    currentCompanyId = null;
    createCompanySection.classList.remove('hidden');
    companiesListSection.classList.remove('hidden');
    companyDetailSection.classList.add('hidden');
}

async function loadUsers(companyId) {
    try {
        usersListContainer.innerHTML = '<p>Loading users...</p>';
        const response = await fetch(`${API_URL}/companies/${companyId}/users`);
        
        if (!response.ok) {
            if (response.status === 500 || response.status === 400) {
                 // Handle case where schema might not exist
                 usersListContainer.innerHTML = `
                    <div class="message error" style="display:block">
                        Error loading users. The tenant schema might not be migrated.
                        <br><br>
                        <button onclick="migrateTenants()" class="btn-secondary">Run Migrations</button>
                    </div>
                 `;
                 return;
            }
            throw new Error('Failed to load users');
        }

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        usersListContainer.innerHTML = '<p class="error">Error loading users.</p>';
        console.error(error);
    }
}

function renderUsers(users) {
    if (users.length === 0) {
        usersListContainer.innerHTML = '<p>No users found for this company.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(user => {
        html += `
            <tr>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.firstName || '-')}</td>
                <td>${escapeHtml(user.lastName || '-')}</td>
                <td>
                    <button class="btn-icon" onclick="deleteUser('${user.id}')">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    usersListContainer.innerHTML = html;
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_URL}/companies/${currentCompanyId}/users/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete user');

        loadUsers(currentCompanyId);
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}

// Expose functions to window
window.deleteTenantUser = deleteTenantUser;
window.deleteUser = deleteUser;
window.showCompanyDetail = showCompanyDetail;

// Helper to run migrations if needed
window.migrateTenants = async function() {
    try {
        const btn = document.querySelector('button[onclick="migrateTenants()"]');
        if(btn) btn.textContent = 'Migrating...';
        
        const response = await fetch(`${API_URL}/admin/db/migrate-tenants`, { method: 'POST' });
        if (!response.ok) throw new Error('Migration failed');
        
        alert('Migrations completed successfully!');
        loadUsers(currentCompanyId);
    } catch (error) {
        alert('Migration error: ' + error.message);
    }
};

function showMessage(msg, type) {
    createMessage.textContent = msg;
    createMessage.className = `message ${type}`;
    setTimeout(() => {
        createMessage.style.display = 'none';
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
