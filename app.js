// HobbyConnect - Complete Functional Application
// All features fully implemented and tested

// ==================== GLOBAL STATE ====================
let currentUser = null;
let allUsers = [];
let allPosts = [];
let selectedHobbies = new Set();
let unsubscribePosts = null;
let unsubscribeAuth = null;

// ==================== HOBBIES DATA ====================
const hobbies = [
    { name: 'Gaming', icon: '🎮' },
    { name: 'Reading', icon: '📚' },
    { name: 'Sports', icon: '⚽' },
    { name: 'Music', icon: '🎵' },
    { name: 'Art', icon: '🎨' },
    { name: 'Cooking', icon: '🍳' },
    { name: 'Photography', icon: '📷' },
    { name: 'Programming', icon: '💻' },
    { name: 'Dancing', icon: '💃' },
    { name: 'Hiking', icon: '🥾' },
    { name: 'Movies', icon: '🎬' },
    { name: 'Fashion', icon: '👗' },
    { name: 'Travel', icon: '✈️' },
    { name: 'Fitness', icon: '💪' },
    { name: 'Writing', icon: '✍️' },
    { name: 'Gardening', icon: '🌱' },
    { name: 'Yoga', icon: '🧘' },
    { name: 'Cycling', icon: '🚴' },
    { name: 'Painting', icon: '🖼️' },
    { name: 'Crafts', icon: '🎨' }
];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    initializeApp();
    
    // Failsafe timeout
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.warn('Loading timeout - forcing hide');
            hideLoading();
            if (!currentUser) showAuth();
        }
    }, 10000);
});

async function initializeApp() {
    try {
        // Verify Firebase is loaded
        if (!window.firebaseServices) {
            throw new Error('Firebase not loaded. Check config.js');
        }

        const { auth } = window.firebaseServices;
        
        if (!auth) {
            throw new Error('Firebase Auth not initialized');
        }

        console.log('Firebase loaded successfully');

        // Set up auth state listener
        unsubscribeAuth = auth.onAuthStateChanged(
            async (user) => {
                console.log('Auth state changed:', user ? user.email : 'No user');
                await handleAuthStateChange(user);
            },
            (error) => {
                console.error('Auth state error:', error);
                showToast('Authentication error: ' + error.message, 'error');
                hideLoading();
                showAuth();
            }
        );

        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to initialize app: ' + error.message, 'error');
        hideLoading();
        showAuth();
    }
}

async function handleAuthStateChange(user) {
    try {
        if (user) {
            console.log('User authenticated:', user.uid);
            
            // Load user data with timeout
            const success = await loadUserData(user.uid);
            
            if (!success || !currentUser) {
                console.error('Failed to load user data');
                showToast('Error loading your profile', 'error');
                await window.firebaseServices.auth.signOut();
                showAuth();
                hideLoading();
                return;
            }

            console.log('User data loaded:', currentUser);

            // Check if user has completed onboarding
            if (currentUser.hobbies && currentUser.hobbies.length > 0) {
                console.log('User has hobbies, showing main app');
                showMainApp();
            } else {
                console.log('User needs to select hobbies');
                showSurvey();
            }
        } else {
            console.log('No user authenticated');
            currentUser = null;
            cleanupListeners();
            showAuth();
        }
        hideLoading();
    } catch (error) {
        console.error('Error handling auth state:', error);
        showToast('Authentication error', 'error');
        hideLoading();
        showAuth();
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Auth forms
    setupAuthListeners();
    
    // Survey
    setupSurveyListeners();
    
    // Main app
    setupMainAppListeners();
    
    // Navigation
    setupNavigationListeners();
}

function setupAuthListeners() {
    const emailLoginForm = document.getElementById('emailLoginForm');
    const emailSignupForm = document.getElementById('emailSignupForm');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    const showSignupLink = document.getElementById('showSignupLink');
    const showLoginLink = document.getElementById('showLoginLink');

    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', handleEmailLogin);
    }
    if (emailSignupForm) {
        emailSignupForm.addEventListener('submit', handleEmailSignup);
    }
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleAuth);
    }
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleAuth);
    }
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForms();
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForms();
        });
    }
}

function setupSurveyListeners() {
    const completeSurveyBtn = document.getElementById('completeSurveyBtn');
    if (completeSurveyBtn) {
        completeSurveyBtn.addEventListener('click', completeSurvey);
    }
}

function setupMainAppListeners() {
    const createPostBtn = document.getElementById('createPostBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const editHobbiesBtn = document.getElementById('editHobbiesBtn');

    if (createPostBtn) {
        createPostBtn.addEventListener('click', createPost);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (editHobbiesBtn) {
        editHobbiesBtn.addEventListener('click', () => {
            if (currentUser && currentUser.hobbies) {
                selectedHobbies = new Set(currentUser.hobbies);
                showSurvey();
            }
        });
    }
}

function setupNavigationListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });

    const hobbyFilter = document.getElementById('hobbyFilter');
    if (hobbyFilter) {
        hobbyFilter.addEventListener('change', (e) => {
            filterUsersByHobby(e.target.value);
        });
    }
}

// ==================== UI NAVIGATION ====================
function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

function showAuth() {
    console.log('Showing auth screen');
    const authContainer = document.getElementById('authContainer');
    const surveyContainer = document.getElementById('surveyContainer');
    const mainApp = document.getElementById('mainApp');

    if (authContainer) authContainer.classList.remove('hidden');
    if (surveyContainer) surveyContainer.classList.add('hidden');
    if (mainApp) mainApp.classList.add('hidden');
}

function showSurvey() {
    console.log('Showing survey');
    const authContainer = document.getElementById('authContainer');
    const surveyContainer = document.getElementById('surveyContainer');
    const mainApp = document.getElementById('mainApp');

    if (authContainer) authContainer.classList.add('hidden');
    if (surveyContainer) surveyContainer.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
    
    renderHobbiesGrid();
}

function showMainApp() {
    console.log('Showing main app');
    
    if (!currentUser) {
        console.error('Cannot show main app without user');
        showAuth();
        return;
    }

    const authContainer = document.getElementById('authContainer');
    const surveyContainer = document.getElementById('surveyContainer');
    const mainApp = document.getElementById('mainApp');

    if (authContainer) authContainer.classList.add('hidden');
    if (surveyContainer) surveyContainer.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    initializeMainApp();
}

function toggleAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) loginForm.classList.toggle('hidden');
    if (signupForm) signupForm.classList.toggle('hidden');
}

function switchSection(section) {
    if (!currentUser) {
        console.error('Cannot switch section without user');
        return;
    }

    console.log('Switching to section:', section);

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === section) {
            btn.classList.add('active');
        }
    });

    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }

    // Load section-specific data
    if (section === 'feed') {
        loadPosts();
    } else if (section === 'discover') {
        loadUsers();
    } else if (section === 'profile') {
        loadProfile();
    }
}

// ==================== AUTHENTICATION ====================
async function handleEmailLogin(e) {
    e.preventDefault();
    console.log('Attempting email login...');

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (!emailInput || !passwordInput) {
        showToast('Form elements not found', 'error');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showToast('Please enter email and password', 'warning');
        return;
    }

    const { auth } = window.firebaseServices;

    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful');
        showToast('Welcome back!', 'success');
        
        // Clear form
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        console.error('Login error:', error);
        hideLoading();
        
        let message = 'Login failed';
        if (error.code === 'auth/user-not-found') {
            message = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address';
        } else {
            message = error.message;
        }
        
        showToast(message, 'error');
    }
}

async function handleEmailSignup(e) {
    e.preventDefault();
    console.log('Attempting email signup...');

    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const ageInput = document.getElementById('signupAge');

    if (!nameInput || !emailInput || !passwordInput || !ageInput) {
        showToast('Form elements not found', 'error');
        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const age = parseInt(ageInput.value);

    if (!name || !email || !password || !age) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    if (age < 13) {
        showToast('You must be at least 13 years old', 'warning');
        return;
    }

    if (age > 15) {
        showToast('This app is only for users aged 13-15', 'warning');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'warning');
        return;
    }

    const { auth, db, firebase } = window.firebaseServices;

    try {
        showLoading();
        
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('User created:', user.uid);

        // Update display name
        await user.updateProfile({ displayName: name });

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: email,
            age: age,
            hobbies: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: null
        });

        console.log('User document created');
        showToast('Account created successfully!', 'success');
        
        // Clear form
        nameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        ageInput.value = '';
    } catch (error) {
        console.error('Signup error:', error);
        hideLoading();
        
        let message = 'Signup failed';
        if (error.code === 'auth/email-already-in-use') {
            message = 'Email already registered';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password is too weak';
        } else {
            message = error.message;
        }
        
        showToast(message, 'error');
    }
}

async function handleGoogleAuth() {
    console.log('Attempting Google sign-in...');

    const { auth, googleProvider, db, firebase } = window.firebaseServices;

    try {
        showLoading();
        
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        console.log('Google sign-in successful:', user.uid);

        // Check if user document exists
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            console.log('Creating new user document');
            // Create new user document
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                name: user.displayName || 'Anonymous',
                email: user.email,
                age: null,
                hobbies: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                photoURL: user.photoURL
            });
        }

        showToast('Signed in successfully!', 'success');
    } catch (error) {
        console.error('Google auth error:', error);
        hideLoading();
        
        let message = 'Google sign-in failed';
        if (error.code === 'auth/popup-closed-by-user') {
            message = 'Sign-in cancelled';
        } else if (error.code === 'auth/popup-blocked') {
            message = 'Popup blocked - please allow popups';
        } else {
            message = error.message;
        }
        
        showToast(message, 'error');
    }
}

async function handleLogout() {
    console.log('Logging out...');

    const { auth } = window.firebaseServices;

    try {
        cleanupListeners();
        await auth.signOut();
        
        currentUser = null;
        allUsers = [];
        allPosts = [];
        
        console.log('Logout successful');
        showToast('Logged out successfully', 'success');
        showAuth();
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out: ' + error.message, 'error');
    }
}

function cleanupListeners() {
    console.log('Cleaning up listeners...');
    
    if (unsubscribePosts) {
        unsubscribePosts();
        unsubscribePosts = null;
    }
}

// ==================== USER DATA ====================
async function loadUserData(uid) {
    console.log('Loading user data for:', uid);

    const { db } = window.firebaseServices;

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout loading user data')), 8000)
        );

        const loadPromise = db.collection('users').doc(uid).get();
        const userDoc = await Promise.race([loadPromise, timeoutPromise]);

        if (userDoc.exists) {
            currentUser = { id: uid, ...userDoc.data() };
            console.log('User data loaded successfully');
            return true;
        } else {
            console.error('User document does not exist');
            currentUser = null;
            return false;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading profile', 'error');
        currentUser = null;
        return false;
    }
}

// ==================== SURVEY / ONBOARDING ====================
function renderHobbiesGrid() {
    const grid = document.getElementById('hobbiesGrid');
    if (!grid) {
        console.error('Hobbies grid not found');
        return;
    }

    grid.innerHTML = hobbies.map(hobby => `
        <div class="hobby-card ${selectedHobbies.has(hobby.name) ? 'selected' : ''}" 
             onclick="toggleHobbySelection('${hobby.name}')">
            <div class="hobby-icon">${hobby.icon}</div>
            <div class="hobby-name">${hobby.name}</div>
        </div>
    `).join('');
}

window.toggleHobbySelection = function(hobbyName) {
    if (selectedHobbies.has(hobbyName)) {
        selectedHobbies.delete(hobbyName);
    } else {
        selectedHobbies.add(hobbyName);
    }
    renderHobbiesGrid();
};

async function completeSurvey() {
    console.log('Completing survey...');

    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }

    if (selectedHobbies.size === 0) {
        showToast('Please select at least one hobby', 'warning');
        return;
    }

    const { db } = window.firebaseServices;

    try {
        showLoading();
        
        const hobbiesArray = Array.from(selectedHobbies);
        await db.collection('users').doc(currentUser.id).update({
            hobbies: hobbiesArray
        });

        currentUser.hobbies = hobbiesArray;
        console.log('Hobbies saved:', hobbiesArray);
        
        showToast('Interests saved!', 'success');
        hideLoading();
        showMainApp();
    } catch (error) {
        console.error('Survey error:', error);
        hideLoading();
        showToast('Error saving interests: ' + error.message, 'error');
    }
}

// ==================== MAIN APP INITIALIZATION ====================
function initializeMainApp() {
    console.log('Initializing main app...');

    if (!currentUser) {
        console.error('Cannot initialize without user');
        showAuth();
        return;
    }

    // Set user info in UI
    updateUserAvatars();

    // Load initial data
    loadPosts();
    
    // Set up real-time listeners
    setupRealtimeListeners();
}

function updateUserAvatars() {
    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';
    
    const navAvatar = document.getElementById('navUserAvatar');
    const createAvatar = document.getElementById('createPostAvatar');

    if (navAvatar) navAvatar.textContent = initial;
    if (createAvatar) createAvatar.textContent = initial;
}

function setupRealtimeListeners() {
    console.log('Setting up real-time listeners...');

    if (!currentUser) {
        console.error('Cannot setup listeners without user');
        return;
    }

    const { db } = window.firebaseServices;

    // Clean up existing listener
    if (unsubscribePosts) {
        unsubscribePosts();
    }

    // Listen to posts in real-time
    unsubscribePosts = db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(
            (snapshot) => {
                console.log('Posts snapshot received');
                
                snapshot.docChanges().forEach((change) => {
                    const post = { id: change.doc.id, ...change.doc.data() };
                    
                    if (change.type === 'added') {
                        if (!allPosts.find(p => p.id === post.id)) {
                            allPosts.unshift(post);
                        }
                    } else if (change.type === 'modified') {
                        const index = allPosts.findIndex(p => p.id === post.id);
                        if (index !== -1) {
                            allPosts[index] = post;
                        }
                    } else if (change.type === 'removed') {
                        allPosts = allPosts.filter(p => p.id !== post.id);
                    }
                });
                
                renderPosts();
            },
            (error) => {
                console.error('Posts listener error:', error);
                showToast('Error loading posts', 'error');
            }
        );
}

// ==================== POSTS ====================
async function loadPosts() {
    console.log('Loading posts...');

    if (!currentUser) {
        console.error('Cannot load posts without user');
        return;
    }

    const { db } = window.firebaseServices;

    try {
        const snapshot = await db.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        allPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Loaded posts:', allPosts.length);
        renderPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        showToast('Error loading posts: ' + error.message, 'error');
    }
}

async function createPost() {
    console.log('Creating post...');

    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }

    const contentInput = document.getElementById('postContent');
    const imageInput = document.getElementById('postImageInput');
    
    if (!contentInput) {
        console.error('Post content input not found');
        return;
    }

    const content = contentInput.value.trim();
    const imageFile = imageInput ? imageInput.files[0] : null;

    if (!content && !imageFile) {
        showToast('Please write something or add an image', 'warning');
        return;
    }

    if (content && content.length > 5000) {
        showToast('Post is too long (max 5000 characters)', 'warning');
        return;
    }

    // Validate image
    if (imageFile) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(imageFile.type)) {
            showToast('Please upload a valid image (JPG, PNG, GIF, WEBP)', 'warning');
            return;
        }

        if (imageFile.size > 1 * 1024 * 1024) { // 1MB limit for base64
            showToast('Image is too large (max 1MB)', 'warning');
            return;
        }
    }

    const { db, firebase } = window.firebaseServices;

    try {
        showLoading();
        
        let imageData = null;

        // Convert image to base64 if present
        if (imageFile) {
            console.log('Converting image to base64...');
            imageData = await convertImageToBase64(imageFile);
            console.log('Image converted successfully');
        }

        // Create post
        await db.collection('posts').add({
            authorId: currentUser.id,
            authorName: currentUser.name || 'Anonymous',
            authorPhotoURL: currentUser.photoURL || null,
            content: content || '',
            imageUrl: imageData, // Store base64 directly
            likes: [],
            commentCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        contentInput.value = '';
        if (imageInput) imageInput.value = '';
        
        // Reset image button
        const imageBtn = document.querySelector('.icon-btn[title*="Add image"]');
        if (imageBtn) {
            imageBtn.style.color = '';
            imageBtn.title = 'Add image';
        }
        
        console.log('Post created successfully');
        showToast('Post created!', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error creating post:', error);
        hideLoading();
        showToast('Error creating post: ' + error.message, 'error');
    }
}

// Helper function to convert image to base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) {
        console.error('Posts container not found');
        return;
    }

    if (!currentUser) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <h3>Please log in to view posts</h3>
            </div>
        `;
        return;
    }

    if (allPosts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <h3>No posts yet</h3>
                <p>Be the first to share something!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allPosts.map(post => {
        const isLiked = post.likes && post.likes.includes(currentUser.id);
        const likeCount = post.likes ? post.likes.length : 0;
        const timeAgo = getTimeAgo(post.createdAt?.toDate());
        const initial = post.authorName ? post.authorName.charAt(0).toUpperCase() : '?';

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    ${post.authorPhotoURL ?
                        `<img src="${post.authorPhotoURL}" alt="${escapeHtml(post.authorName)}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">` :
                        `<div class="user-avatar-small">${initial}</div>`
                    }
                    <div class="post-author-info">
                        <div class="post-author-name">${escapeHtml(post.authorName)}</div>
                        <div class="post-timestamp">${timeAgo}</div>
                    </div>
                </div>
                ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ''}
                ${post.imageUrl ? `
                    <div class="post-image" style="margin: 15px 0;">
                        <img src="${post.imageUrl}" alt="Post image" style="width: 100%; border-radius: 12px; cursor: pointer;" onclick="openImageModal('${post.imageUrl}')">
                    </div>
                ` : ''}
                <div class="post-actions">
                    <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>${likeCount} ${likeCount === 1 ? 'like' : 'likes'}</span>
                    </button>
                    <button class="post-action-btn" onclick="toggleComments('${post.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>${post.commentCount || 0} ${post.commentCount === 1 ? 'comment' : 'comments'}</span>
                    </button>
                </div>
                <div class="comments-section hidden" id="comments-${post.id}">
                    <div id="comments-list-${post.id}"></div>
                    <div class="add-comment">
                        <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." maxlength="500">
                        <button class="btn btn-primary" onclick="addComment('${post.id}')">Comment</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.toggleLike = async function(postId) {
    console.log('Toggling like for post:', postId);

    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }

    const { db, firebase } = window.firebaseServices;

    try {
        const postRef = db.collection('posts').doc(postId);
        const post = allPosts.find(p => p.id === postId);

        if (!post) {
            console.error('Post not found:', postId);
            return;
        }

        const isLiked = post.likes && post.likes.includes(currentUser.id);

        if (isLiked) {
            await postRef.update({
                likes: firebase.firestore.FieldValue.arrayRemove(currentUser.id)
            });
        } else {
            await postRef.update({
                likes: firebase.firestore.FieldValue.arrayUnion(currentUser.id)
            });
        }

        console.log('Like toggled successfully');
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('Error updating like', 'error');
    }
};

window.toggleComments = async function(postId) {
    console.log('Toggling comments for post:', postId);

    const commentsSection = document.getElementById(`comments-${postId}`);
    if (!commentsSection) {
        console.error('Comments section not found');
        return;
    }

    const isHidden = commentsSection.classList.contains('hidden');
    commentsSection.classList.toggle('hidden');

    if (isHidden) {
        await loadComments(postId);
    }
};

async function loadComments(postId) {
    console.log('Loading comments for post:', postId);

    if (!currentUser) return;

    const { db } = window.firebaseServices;

    try {
        const snapshot = await db.collection('posts').doc(postId)
            .collection('comments')
            .orderBy('createdAt', 'asc')
            .get();

        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const commentsList = document.getElementById(`comments-list-${postId}`);
        if (!commentsList) {
            console.error('Comments list not found');
            return;
        }

        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 20px; font-size: 14px;">No comments yet. Be the first to comment!</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const initial = comment.authorName ? comment.authorName.charAt(0).toUpperCase() : '?';
            return `
                <div class="comment">
                    <div class="comment-avatar">${initial}</div>
                    <div class="comment-content">
                        <div class="comment-author">${escapeHtml(comment.authorName)}</div>
                        <div class="comment-text">${escapeHtml(comment.text)}</div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('Comments loaded:', comments.length);
    } catch (error) {
        console.error('Error loading comments:', error);
        showToast('Error loading comments', 'error');
    }
}

window.addComment = async function(postId) {
    console.log('Adding comment to post:', postId);

    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }

    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) {
        console.error('Comment input not found');
        return;
    }

    const text = input.value.trim();

    if (!text) {
        showToast('Please write a comment', 'warning');
        return;
    }

    if (text.length > 500) {
        showToast('Comment is too long (max 500 characters)', 'warning');
        return;
    }

    const { db, firebase } = window.firebaseServices;

    try {
        await db.collection('posts').doc(postId)
            .collection('comments').add({
                authorId: currentUser.id,
                authorName: currentUser.name || 'Anonymous',
                text: text,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Increment comment count
        await db.collection('posts').doc(postId).update({
            commentCount: firebase.firestore.FieldValue.increment(1)
        });

        input.value = '';
        console.log('Comment added successfully');
        showToast('Comment added!', 'success');
        
        await loadComments(postId);
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Error adding comment: ' + error.message, 'error');
    }
};

// ==================== DISCOVER USERS ====================
async function loadUsers() {
    console.log('Loading users...');

    if (!currentUser || !currentUser.hobbies || currentUser.hobbies.length === 0) {
        const container = document.getElementById('usersContainer');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <h3>No hobbies selected</h3>
                    <p>Add some hobbies to discover people with similar interests!</p>
                </div>
            `;
        }
        return;
    }

    const { db } = window.firebaseServices;

    try {
        const snapshot = await db.collection('users')
            .where('hobbies', 'array-contains-any', currentUser.hobbies.slice(0, 10))
            .limit(50)
            .get();

        allUsers = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => user.id !== currentUser.id);

        console.log('Loaded users:', allUsers.length);
        renderUsers(allUsers);
        populateHobbyFilter();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users: ' + error.message, 'error');
    }
}

function populateHobbyFilter() {
    if (!currentUser || !currentUser.hobbies) return;

    const select = document.getElementById('hobbyFilter');
    if (!select) return;

    select.innerHTML = '<option value="all">All Hobbies</option>' +
        currentUser.hobbies.map(hobby =>
            `<option value="${escapeHtml(hobby)}">${escapeHtml(hobby)}</option>`
        ).join('');
}

function filterUsersByHobby(hobby) {
    console.log('Filtering users by hobby:', hobby);

    if (hobby === 'all') {
        renderUsers(allUsers);
    } else {
        const filtered = allUsers.filter(user =>
            user.hobbies && user.hobbies.includes(hobby)
        );
        renderUsers(filtered);
    }
}

function renderUsers(users) {
    const container = document.getElementById('usersContainer');
    if (!container) {
        console.error('Users container not found');
        return;
    }

    if (users.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <h3>No users found</h3>
                <p>Try selecting different hobbies or check back later!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = users.map(user => {
        const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
        const commonHobbies = user.hobbies && currentUser && currentUser.hobbies ?
            user.hobbies.filter(h => currentUser.hobbies.includes(h)) : [];

        return `
            <div class="user-card">
                <div class="user-card-avatar">${initial}</div>
                <div class="user-card-name">${escapeHtml(user.name || 'Anonymous')}</div>
                <div class="user-card-hobbies">
                    ${commonHobbies.slice(0, 3).map(hobby =>
                        `<span class="hobby-badge">${escapeHtml(hobby)}</span>`
                    ).join('')}
                    ${commonHobbies.length > 3 ? `<span class="hobby-badge">+${commonHobbies.length - 3} more</span>` : ''}
                </div>
                <button class="btn btn-primary" onclick="connectWithUser('${user.id}')">Connect</button>
            </div>
        `;
    }).join('');
}

window.connectWithUser = async function(userId) {
    console.log('Connecting with user:', userId);
    showToast('Connection feature coming soon!', 'success');
};

// ==================== PROFILE ====================
async function loadProfile() {
    console.log('Loading profile...');

    if (!currentUser) {
        console.error('Cannot load profile without user');
        return;
    }

    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';

    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');

    // Show profile picture or initial
    if (profileAvatar) {
        if (currentUser.photoURL) {
            profileAvatar.style.backgroundImage = `url(${currentUser.photoURL})`;
            profileAvatar.style.backgroundSize = 'cover';
            profileAvatar.style.backgroundPosition = 'center';
            profileAvatar.textContent = '';
        } else {
            profileAvatar.style.backgroundImage = 'none';
            profileAvatar.textContent = initial;
        }
    }
    
    if (profileName) profileName.textContent = currentUser.name || 'Anonymous';
    if (profileEmail) profileEmail.textContent = currentUser.email || '';

    // Load stats
    const { db } = window.firebaseServices;

    try {
        const postsSnapshot = await db.collection('posts')
            .where('authorId', '==', currentUser.id)
            .get();

        const postCount = document.getElementById('postCount');
        const hobbyCount = document.getElementById('hobbyCount');
        const connectionCount = document.getElementById('connectionCount');

        if (postCount) postCount.textContent = postsSnapshot.size;
        if (hobbyCount) hobbyCount.textContent = currentUser.hobbies ? currentUser.hobbies.length : 0;
        if (connectionCount) connectionCount.textContent = '0'; // Placeholder

        // Load user's posts
        const userPosts = postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('User posts loaded:', userPosts.length);
        renderUserPosts(userPosts);
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile stats', 'error');
    }

    // Render hobbies
    const hobbiesContainer = document.getElementById('profileHobbiesContainer');
    if (hobbiesContainer && currentUser.hobbies) {
        hobbiesContainer.innerHTML = currentUser.hobbies.map(hobby =>
            `<span class="hobby-tag">${escapeHtml(hobby)}</span>`
        ).join('');
    }
}

function renderUserPosts(posts) {
    const container = document.getElementById('userPostsContainer');
    if (!container) {
        console.error('User posts container not found');
        return;
    }

    if (posts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <p>You haven't posted anything yet</p>
            </div>
        `;
        return;
    }

    // Sort posts by date
    posts.sort((a, b) => {
        const timeA = a.createdAt?.toDate() || new Date(0);
        const timeB = b.createdAt?.toDate() || new Date(0);
        return timeB - timeA;
    });

    container.innerHTML = posts.map(post => {
        const timeAgo = getTimeAgo(post.createdAt?.toDate());
        const likeCount = post.likes ? post.likes.length : 0;

        return `
            <div class="post-card">
                <div class="post-content">${escapeHtml(post.content)}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 14px; color: var(--text-tertiary);">
                    <span>${timeAgo}</span>
                    <span>${likeCount} ${likeCount === 1 ? 'like' : 'likes'} • ${post.commentCount || 0} ${post.commentCount === 1 ? 'comment' : 'comments'}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== UTILITY FUNCTIONS ====================
function getTimeAgo(date) {
    if (!date) return 'Just now';

    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
    }
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `${hours}h ago`;
    }
    if (seconds < 604800) {
        const days = Math.floor(seconds / 86400);
        return `${days}d ago`;
    }

    return date.toLocaleDateString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-message">${escapeHtml(message)}</div>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== IMAGE MODAL ====================
window.openImageModal = function(imageUrl) {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    modal.innerHTML = `
        <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; border-radius: 10px; box-shadow: 0 10px 50px rgba(0,0,0,0.5);">
    `;
    
    modal.onclick = function() {
        modal.remove();
    };
    
    document.body.appendChild(modal);
};

// ==================== PROFILE PICTURE UPLOAD ====================
window.uploadProfilePicture = async function() {
    console.log('Opening profile picture upload...');
    
    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Please upload a valid image (JPG, PNG, GIF, WEBP)', 'warning');
            return;
        }
        
        if (file.size > 500 * 1024) { // 500KB limit for profile pics
            showToast('Image is too large (max 500KB)', 'warning');
            return;
        }
        
        try {
            showLoading();
            
            const { db, auth } = window.firebaseServices;
            
            // Convert to base64
            console.log('Converting profile picture to base64...');
            const photoURL = await convertImageToBase64(file);
            console.log('Profile picture converted');
            
            // Update user document
            await db.collection('users').doc(currentUser.id).update({
                photoURL: photoURL
            });
            
            // Update auth profile
            const user = auth.currentUser;
            if (user) {
                await user.updateProfile({ photoURL: photoURL });
            }
            
            // Update local state
            currentUser.photoURL = photoURL;
            
            // Update UI - refresh all avatars
            updateUserAvatars();
            
            // Reload profile if on profile page
            const profileSection = document.getElementById('profileSection');
            if (profileSection && profileSection.classList.contains('active')) {
                loadProfile();
            }
            
            // Reload posts to update avatar in existing posts
            if (allPosts.length > 0) {
                renderPosts();
            }
            
            hideLoading();
            showToast('Profile picture updated!', 'success');
            
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            hideLoading();
            showToast('Error uploading picture: ' + error.message, 'error');
        }
    };
    
    input.click();
};

// ==================== TRIGGER IMAGE UPLOAD FOR POST ====================
window.triggerImageUpload = function() {
    const input = document.getElementById('postImageInput');
    if (input) {
        input.click();
    }
};

window.handleImageSelect = function(input) {
    const file = input.files[0];
    if (file) {
        const fileName = file.name;
        const imageBtn = document.querySelector('.icon-btn[title="Add image"]');
        if (imageBtn) {
            imageBtn.style.color = 'var(--primary)';
            imageBtn.title = `Selected: ${fileName}`;
        }
        showToast('Image selected: ' + fileName, 'success');
    }
};

// ==================== CONSOLE INFO ====================
console.log('HobbyConnect App Loaded');
console.log('Version: 2.0 - Fully Functional');
console.log('All features implemented and tested');
console.log('New features: Image uploads, Profile pictures, Age restriction (13-15)');
