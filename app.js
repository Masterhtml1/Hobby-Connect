// Main Application JavaScript - FIXED VERSION
// HobbyConnect - Real-time social platform for hobby enthusiasts

// Global state
let currentUser = null;
let allUsers = [];
let allPosts = [];
let selectedHobbies = new Set();
let unsubscribePosts = null; // Store unsubscribe function

// Available hobbies
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
    { name: 'Gardening', icon: '🌱' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    // Failsafe: Hide loading screen after 10 seconds no matter what
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.warn('Loading screen timeout - forcing hide');
            hideLoading();
            
            // If still no user, show auth
            if (!currentUser) {
                showAuth();
            }
        }
    }, 10000);
});

async function initializeApp() {
    // Check if Firebase is loaded
    if (!window.firebaseServices || !window.firebaseServices.auth) {
        console.error('Firebase not initialized properly');
        showToast('Firebase configuration error. Please check config.js', 'error');
        hideLoading();
        showAuth();
        return;
    }
    
    const { auth } = window.firebaseServices;
    
    // Check authentication state
    auth.onAuthStateChanged(async (user) => {
        try {
            if (user) {
                await loadUserData(user.uid);
                
                // Check if user data loaded successfully
                if (!currentUser) {
                    console.error('Failed to load user data');
                    showToast('Error loading user data', 'error');
                    await auth.signOut();
                    showAuth();
                    hideLoading();
                    return;
                }
                
                if (currentUser.hobbies && currentUser.hobbies.length > 0) {
                    showMainApp();
                } else {
                    showSurvey();
                }
            } else {
                currentUser = null;
                showAuth();
            }
            hideLoading();
        } catch (error) {
            console.error('Auth state change error:', error);
            showToast('Authentication error: ' + error.message, 'error');
            showAuth();
            hideLoading();
        }
    }, (error) => {
        // onAuthStateChanged error callback
        console.error('Auth state observer error:', error);
        showToast('Authentication system error', 'error');
        showAuth();
        hideLoading();
    });

    setupEventListeners();
}

function setupEventListeners() {
    // Auth form listeners
    const emailLoginForm = document.getElementById('emailLoginForm');
    const emailSignupForm = document.getElementById('emailSignupForm');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    const showSignupLink = document.getElementById('showSignupLink');
    const showLoginLink = document.getElementById('showLoginLink');
    
    if (emailLoginForm) emailLoginForm.addEventListener('submit', handleEmailLogin);
    if (emailSignupForm) emailSignupForm.addEventListener('submit', handleEmailSignup);
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuth);
    if (googleSignupBtn) googleSignupBtn.addEventListener('click', handleGoogleAuth);
    if (showSignupLink) showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms();
    });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms();
    });

    // Survey listeners
    const completeSurveyBtn = document.getElementById('completeSurveyBtn');
    if (completeSurveyBtn) completeSurveyBtn.addEventListener('click', completeSurvey);

    // Main app listeners
    const createPostBtn = document.getElementById('createPostBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const editHobbiesBtn = document.getElementById('editHobbiesBtn');
    
    if (createPostBtn) createPostBtn.addEventListener('click', createPost);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (editHobbiesBtn) editHobbiesBtn.addEventListener('click', () => {
        if (currentUser && currentUser.hobbies) {
            selectedHobbies = new Set(currentUser.hobbies);
            showSurvey();
        }
    });

    // Navigation listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            switchSection(section);
        });
    });

    // Hobby filter listener
    const hobbyFilter = document.getElementById('hobbyFilter');
    if (hobbyFilter) {
        hobbyFilter.addEventListener('change', (e) => {
            filterUsersByHobby(e.target.value);
        });
    }
}

// UI Navigation
function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.classList.remove('hidden');
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
}

function showAuth() {
    document.getElementById('authContainer')?.classList.remove('hidden');
    document.getElementById('surveyContainer')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.add('hidden');
}

function showSurvey() {
    document.getElementById('authContainer')?.classList.add('hidden');
    document.getElementById('surveyContainer')?.classList.remove('hidden');
    document.getElementById('mainApp')?.classList.add('hidden');
    renderHobbiesGrid();
}

function showMainApp() {
    if (!currentUser) {
        console.error('Cannot show main app: currentUser is null');
        showAuth();
        return;
    }
    
    document.getElementById('authContainer')?.classList.add('hidden');
    document.getElementById('surveyContainer')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.remove('hidden');
    initializeMainApp();
}

function toggleAuthForms() {
    document.getElementById('loginForm')?.classList.toggle('hidden');
    document.getElementById('signupForm')?.classList.toggle('hidden');
}

function switchSection(section) {
    if (!currentUser) {
        console.error('Cannot switch section: currentUser is null');
        return;
    }
    
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
    if (sectionElement) sectionElement.classList.add('active');

    // Load section-specific data
    if (section === 'feed') {
        loadPosts();
    } else if (section === 'discover') {
        loadUsers();
    } else if (section === 'profile') {
        loadProfile();
    }
}

// Authentication
async function handleEmailLogin(e) {
    e.preventDefault();
    const { auth } = window.firebaseServices;
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Welcome back!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showToast(error.message, 'error');
    }
}

async function handleEmailSignup(e) {
    e.preventDefault();
    const { auth, db } = window.firebaseServices;
    
    const name = document.getElementById('signupName')?.value;
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const age = parseInt(document.getElementById('signupAge')?.value);

    if (!name || !email || !password || !age) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    try {
        showLoading();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

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

        showToast('Account created successfully!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Signup error:', error);
        showToast(error.message, 'error');
    }
}

async function handleGoogleAuth() {
    const { auth, googleProvider, db } = window.firebaseServices;
    
    try {
        showLoading();
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;

        // Check if user document exists
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create new user document
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                age: null,
                hobbies: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                photoURL: user.photoURL
            });
        }

        showToast('Signed in successfully!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Google auth error:', error);
        showToast(error.message, 'error');
    }
}

async function handleLogout() {
    const { auth } = window.firebaseServices;
    
    try {
        // Unsubscribe from real-time listeners
        if (unsubscribePosts) {
            unsubscribePosts();
            unsubscribePosts = null;
        }
        
        await auth.signOut();
        currentUser = null;
        allUsers = [];
        allPosts = [];
        showToast('Logged out successfully', 'success');
        showAuth();
    } catch (error) {
        console.error('Logout error:', error);
        showToast(error.message, 'error');
    }
}

// User Data
async function loadUserData(uid) {
    const { db } = window.firebaseServices;
    
    try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout loading user data')), 8000)
        );
        
        const loadPromise = db.collection('users').doc(uid).get();
        
        const userDoc = await Promise.race([loadPromise, timeoutPromise]);
        
        if (userDoc.exists) {
            currentUser = { id: uid, ...userDoc.data() };
            console.log('User loaded:', currentUser);
        } else {
            console.error('User document does not exist');
            currentUser = null;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading user data: ' + error.message, 'error');
        currentUser = null;
        throw error; // Re-throw to be caught by caller
    }
}

// Survey/Onboarding
function renderHobbiesGrid() {
    const grid = document.getElementById('hobbiesGrid');
    if (!grid) return;
    
    grid.innerHTML = hobbies.map(hobby => `
        <div class="hobby-card ${selectedHobbies.has(hobby.name) ? 'selected' : ''}" 
             onclick="toggleHobbySelection('${hobby.name}')">
            <div class="hobby-icon">${hobby.icon}</div>
            <div class="hobby-name">${hobby.name}</div>
        </div>
    `).join('');
}

function toggleHobbySelection(hobbyName) {
    if (selectedHobbies.has(hobbyName)) {
        selectedHobbies.delete(hobbyName);
    } else {
        selectedHobbies.add(hobbyName);
    }
    renderHobbiesGrid();
}

async function completeSurvey() {
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
        await db.collection('users').doc(currentUser.id).update({
            hobbies: Array.from(selectedHobbies)
        });
        
        currentUser.hobbies = Array.from(selectedHobbies);
        showToast('Interests saved!', 'success');
        hideLoading();
        showMainApp();
    } catch (error) {
        hideLoading();
        console.error('Survey error:', error);
        showToast(error.message, 'error');
    }
}

// Main App Initialization
async function initializeMainApp() {
    if (!currentUser) {
        console.error('Cannot initialize main app: currentUser is null');
        showAuth();
        return;
    }
    
    // Set user info in UI
    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';
    const navAvatar = document.getElementById('navUserAvatar');
    const createAvatar = document.getElementById('createPostAvatar');
    
    if (navAvatar) navAvatar.textContent = initial;
    if (createAvatar) createAvatar.textContent = initial;

    // Load initial data
    await loadPosts();
    setupRealtimeListeners();
}

function setupRealtimeListeners() {
    if (!currentUser) {
        console.error('Cannot setup listeners: currentUser is null');
        return;
    }
    
    const { db } = window.firebaseServices;
    
    // Unsubscribe from previous listener if exists
    if (unsubscribePosts) {
        unsubscribePosts();
    }
    
    // Listen to posts in real-time
    unsubscribePosts = db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const post = { id: change.doc.id, ...change.doc.data() };
                    if (!allPosts.find(p => p.id === post.id)) {
                        allPosts.unshift(post);
                        renderPosts();
                    }
                } else if (change.type === 'modified') {
                    const index = allPosts.findIndex(p => p.id === change.doc.id);
                    if (index !== -1) {
                        allPosts[index] = { id: change.doc.id, ...change.doc.data() };
                        renderPosts();
                    }
                } else if (change.type === 'removed') {
                    allPosts = allPosts.filter(p => p.id !== change.doc.id);
                    renderPosts();
                }
            });
        }, (error) => {
            console.error('Error listening to posts:', error);
        });
}

// Posts
async function loadPosts() {
    if (!currentUser) {
        console.error('Cannot load posts: currentUser is null');
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
        
        renderPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        showToast('Error loading posts', 'error');
    }
}

async function createPost() {
    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }
    
    const contentInput = document.getElementById('postContent');
    if (!contentInput) return;
    
    const content = contentInput.value.trim();
    
    if (!content) {
        showToast('Please write something', 'warning');
        return;
    }

    const { db } = window.firebaseServices;
    
    try {
        await db.collection('posts').add({
            authorId: currentUser.id,
            authorName: currentUser.name || 'Anonymous',
            authorPhotoURL: currentUser.photoURL || null,
            content: content,
            likes: [],
            commentCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        contentInput.value = '';
        showToast('Post created!', 'success');
    } catch (error) {
        console.error('Error creating post:', error);
        showToast('Error creating post', 'error');
    }
}

function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    if (!currentUser) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Please log in to view posts</div>';
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
                        `<img src="${post.authorPhotoURL}" alt="${post.authorName}" style="width: 48px; height: 48px; border-radius: 50%;">` :
                        `<div class="user-avatar-small">${initial}</div>`
                    }
                    <div class="post-author-info">
                        <div class="post-author-name">${escapeHtml(post.authorName)}</div>
                        <div class="post-timestamp">${timeAgo}</div>
                    </div>
                </div>
                <div class="post-content">${escapeHtml(post.content)}</div>
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
                        <input type="text" id="comment-input-${post.id}" placeholder="Write a comment...">
                        <button class="btn btn-primary" onclick="addComment('${post.id}')">Comment</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleLike(postId) {
    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }
    
    const { db, firebase } = window.firebaseServices;
    
    try {
        const postRef = db.collection('posts').doc(postId);
        const post = allPosts.find(p => p.id === postId);
        
        if (!post) return;

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
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('Error updating like', 'error');
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (!commentsSection) return;
    
    commentsSection.classList.toggle('hidden');
    
    if (!commentsSection.classList.contains('hidden')) {
        await loadComments(postId);
    }
}

async function loadComments(postId) {
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
        if (!commentsList) return;
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 20px;">No comments yet</p>';
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
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function addComment(postId) {
    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }
    
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const text = input.value.trim();
    
    if (!text) {
        showToast('Please write a comment', 'warning');
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
        await loadComments(postId);
        showToast('Comment added!', 'success');
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Error adding comment', 'error');
    }
}

// Discover Users
async function loadUsers() {
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
        
        renderUsers(allUsers);
        populateHobbyFilter();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

function populateHobbyFilter() {
    if (!currentUser || !currentUser.hobbies) return;
    
    const select = document.getElementById('hobbyFilter');
    if (!select) return;
    
    select.innerHTML = '<option value="all">All Hobbies</option>' +
        currentUser.hobbies.map(hobby => 
            `<option value="${hobby}">${hobby}</option>`
        ).join('');
}

function filterUsersByHobby(hobby) {
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
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                <h3>No users found</h3>
                <p>Try selecting different hobbies in your profile</p>
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
                        `<span class="hobby-badge">${hobby}</span>`
                    ).join('')}
                    ${commonHobbies.length > 3 ? `<span class="hobby-badge">+${commonHobbies.length - 3} more</span>` : ''}
                </div>
                <button class="btn btn-primary" onclick="connectWithUser('${user.id}')">Connect</button>
            </div>
        `;
    }).join('');
}

async function connectWithUser(userId) {
    // Placeholder for connection functionality
    showToast('Connection feature coming soon!', 'success');
}

// Profile
async function loadProfile() {
    if (!currentUser) {
        console.error('Cannot load profile: currentUser is null');
        return;
    }
    
    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';
    
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileAvatar) profileAvatar.textContent = initial;
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
        
        renderUserPosts(userPosts);
    } catch (error) {
        console.error('Error loading profile:', error);
    }
    
    // Render hobbies
    const hobbiesContainer = document.getElementById('profileHobbiesContainer');
    if (hobbiesContainer && currentUser.hobbies) {
        hobbiesContainer.innerHTML = currentUser.hobbies.map(hobby => 
            `<span class="hobby-tag">${hobby}</span>`
        ).join('');
    }
}

function renderUserPosts(posts) {
    const container = document.getElementById('userPostsContainer');
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <p>You haven't posted anything yet</p>
            </div>
        `;
        return;
    }

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

// Utility Functions
function getTimeAgo(date) {
    if (!date) return 'Just now';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    
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
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-message">${escapeHtml(message)}</div>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
