// Main Application JavaScript
// HobbyConnect - Real-time social platform for hobby enthusiasts

// Global state
let currentUser = null;
let allUsers = [];
let allPosts = [];
let selectedHobbies = new Set();

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
});

async function initializeApp() {
    const { auth } = window.firebaseServices;
    
    // Check authentication state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserData(user.uid);
            if (currentUser && currentUser.hobbies && currentUser.hobbies.length > 0) {
                showMainApp();
            } else {
                showSurvey();
            }
        } else {
            showAuth();
        }
        hideLoading();
    });

    setupEventListeners();
}

function setupEventListeners() {
    // Auth form listeners
    document.getElementById('emailLoginForm')?.addEventListener('submit', handleEmailLogin);
    document.getElementById('emailSignupForm')?.addEventListener('submit', handleEmailSignup);
    document.getElementById('googleLoginBtn')?.addEventListener('click', handleGoogleAuth);
    document.getElementById('googleSignupBtn')?.addEventListener('click', handleGoogleAuth);
    document.getElementById('showSignupLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms();
    });
    document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms();
    });

    // Survey listeners
    document.getElementById('completeSurveyBtn')?.addEventListener('click', completeSurvey);

    // Main app listeners
    document.getElementById('createPostBtn')?.addEventListener('click', createPost);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('editHobbiesBtn')?.addEventListener('click', () => {
        selectedHobbies = new Set(currentUser.hobbies);
        showSurvey();
    });

    // Navigation listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            switchSection(section);
        });
    });

    // Hobby filter listener
    document.getElementById('hobbyFilter')?.addEventListener('change', (e) => {
        filterUsersByHobby(e.target.value);
    });
}

// UI Navigation
function showLoading() {
    document.getElementById('loadingScreen').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingScreen').classList.add('hidden');
}

function showAuth() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('surveyContainer').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showSurvey() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('surveyContainer').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    renderHobbiesGrid();
}

function showMainApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('surveyContainer').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initializeMainApp();
}

function toggleAuthForms() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('signupForm').classList.toggle('hidden');
}

function switchSection(section) {
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
    document.getElementById(`${section}Section`).classList.add('active');

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
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Welcome back!', 'success');
    } catch (error) {
        hideLoading();
        showToast(error.message, 'error');
    }
}

async function handleEmailSignup(e) {
    e.preventDefault();
    const { auth, db } = window.firebaseServices;
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const age = parseInt(document.getElementById('signupAge').value);

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
        showToast(error.message, 'error');
    }
}

async function handleLogout() {
    const { auth } = window.firebaseServices;
    
    try {
        await auth.signOut();
        currentUser = null;
        allUsers = [];
        allPosts = [];
        showToast('Logged out successfully', 'success');
        showAuth();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// User Data
async function loadUserData(uid) {
    const { db } = window.firebaseServices;
    
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            currentUser = { id: uid, ...userDoc.data() };
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading user data', 'error');
    }
}

// Survey/Onboarding
function renderHobbiesGrid() {
    const grid = document.getElementById('hobbiesGrid');
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
        showMainApp();
    } catch (error) {
        hideLoading();
        showToast(error.message, 'error');
    }
}

// Main App Initialization
async function initializeMainApp() {
    // Set user info in UI
    const initial = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('navUserAvatar').textContent = initial;
    document.getElementById('createPostAvatar').textContent = initial;

    // Load initial data
    await loadPosts();
    setupRealtimeListeners();
}

function setupRealtimeListeners() {
    const { db } = window.firebaseServices;
    
    // Listen to posts in real-time
    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    // New post added
                    const post = { id: change.doc.id, ...change.doc.data() };
                    if (!allPosts.find(p => p.id === post.id)) {
                        allPosts.unshift(post);
                        renderPosts();
                    }
                } else if (change.type === 'modified') {
                    // Post updated
                    const index = allPosts.findIndex(p => p.id === change.doc.id);
                    if (index !== -1) {
                        allPosts[index] = { id: change.doc.id, ...change.doc.data() };
                        renderPosts();
                    }
                } else if (change.type === 'removed') {
                    // Post deleted
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
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
        showToast('Please write something', 'warning');
        return;
    }

    const { db } = window.firebaseServices;
    
    try {
        await db.collection('posts').add({
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorPhotoURL: currentUser.photoURL,
            content: content,
            likes: [],
            commentCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('postContent').value = '';
        showToast('Post created!', 'success');
    } catch (error) {
        console.error('Error creating post:', error);
        showToast('Error creating post', 'error');
    }
}

function renderPosts() {
    const container = document.getElementById('postsContainer');
    
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
        const initial = post.authorName.charAt(0).toUpperCase();

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    ${post.authorPhotoURL ? 
                        `<img src="${post.authorPhotoURL}" alt="${post.authorName}" style="width: 48px; height: 48px; border-radius: 50%;">` :
                        `<div class="user-avatar-small">${initial}</div>`
                    }
                    <div class="post-author-info">
                        <div class="post-author-name">${post.authorName}</div>
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
    commentsSection.classList.toggle('hidden');
    
    if (!commentsSection.classList.contains('hidden')) {
        await loadComments(postId);
    }
}

async function loadComments(postId) {
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
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 20px;">No comments yet</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const initial = comment.authorName.charAt(0).toUpperCase();
            return `
                <div class="comment">
                    <div class="comment-avatar">${initial}</div>
                    <div class="comment-content">
                        <div class="comment-author">${comment.authorName}</div>
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
    const input = document.getElementById(`comment-input-${postId}`);
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
                authorName: currentUser.name,
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
    const select = document.getElementById('hobbyFilter');
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
        const initial = user.name.charAt(0).toUpperCase();
        const commonHobbies = user.hobbies.filter(h => currentUser.hobbies.includes(h));
        
        return `
            <div class="user-card">
                <div class="user-card-avatar">${initial}</div>
                <div class="user-card-name">${user.name}</div>
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
    const initial = currentUser.name.charAt(0).toUpperCase();
    
    document.getElementById('profileAvatar').textContent = initial;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    // Load stats
    const { db } = window.firebaseServices;
    
    try {
        const postsSnapshot = await db.collection('posts')
            .where('authorId', '==', currentUser.id)
            .get();
        
        document.getElementById('postCount').textContent = postsSnapshot.size;
        document.getElementById('hobbyCount').textContent = currentUser.hobbies.length;
        document.getElementById('connectionCount').textContent = '0'; // Placeholder
        
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
    hobbiesContainer.innerHTML = currentUser.hobbies.map(hobby => 
        `<span class="hobby-tag">${hobby}</span>`
    ).join('');
}

function renderUserPosts(posts) {
    const container = document.getElementById('userPostsContainer');
    
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-message">${message}</div>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
