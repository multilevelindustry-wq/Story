const firebaseConfig = {
  apiKey: "AIzaSyAC3qCkDfdS2X8YA6deg01lXif7qAStfQQ",
  authDomain: "neostore-81b57.firebaseapp.com",
  databaseURL: "https://neostore-81b57-default-rtdb.firebaseio.com",
  projectId: "neostore-81b57",
  storageBucket: "neostore-81b57.firebasestorage.app",
  messagingSenderId: "760637387702",
  appId: "1:760637387702:web:3c7c231c34a3513d1a4717",
  measurementId: "G-1PBBK48DCK"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore
const db = firebase.firestore();


const postsContainer = document.getElementById("postsContainer");
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });
}



function displayPosts(list) {
  postsContainer.innerHTML = "";

  list.forEach(post => {
    postsContainer.innerHTML += `
      <div class="post-card">
        <img src="${post.image}" loading="lazy">
        <div class="post-content">
          <h3>${post.title}</h3>
<div class="post-views" id="views-${post.slug}">
  👁 Loading views...
</div>
          <p>${post.excerpt}</p>
          <a href="post.html?slug=${post.slug}" class="read-btn">Read Story</a>
        </div>
      </div>
    `;
  });
}

if (postsContainer) {

  // randomly pick 10 posts
  const randomPosts = getRandomPosts(posts, 16);

  displayPosts(randomPosts);
  
  loadHomepageViews();
}


async function loadHomepageViews() {

  posts.forEach(async post => {

    const ref = db.collection("views").doc(post.slug);

    const doc = await ref.get();

    let views = 0;

    if (doc.exists) {
      views = doc.data().count;
    }

    const el = document.getElementById(`views-${post.slug}`);

    if (el) {
      el.innerHTML = `👁 ${views} views`;
    }
  });
}



function searchPosts() {
  const value = document.getElementById("searchInput").value.toLowerCase();

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(value)
  );

  displayPosts(filtered);
}

// LOAD SINGLE POST
const postContent = document.getElementById("postContent");

async function incrementViews(slug) {

  const ref = db.collection("views").doc(slug);

  try {

    const doc = await ref.get();

    if (doc.exists) {

      await ref.update({
        count: firebase.firestore.FieldValue.increment(1)
      });

    } else {

      await ref.set({
        count: 1
      });
    }

  } catch (err) {
    console.log(err);
  }
}



if (postContent) {
  const slug = new URLSearchParams(window.location.search).get("slug");

  const post = posts.find(p => p.slug === slug);

  if (post) {
  
  incrementViews(post.slug);
  
    document.title = post.title;

    postContent.innerHTML = `
      <img src="${post.image}" loading="lazy">
      <h1>${post.title}</h1>
      ${post.content}
    `;

    loadRelated(post.slug);
    
    loadComments();
    
    loadPostViews(post.slug);
    
  }
}

async function loadPostViews(slug) {

  const ref = db.collection("views").doc(slug);

  const doc = await ref.get();

  let views = 0;

  if (doc.exists) {
    views = doc.data().count;
  }

  const title = document.querySelector(".main-post h1");

  title.innerHTML += `
    <div class="view-count">
      👁 ${views} views
    </div>
  `;
}


function loadRelated(currentSlug) {

  const related = document.getElementById("relatedPosts");

  related.innerHTML = "";

  // Remove current post
  const filteredPosts = posts.filter(p => p.slug !== currentSlug);

  // Shuffle posts randomly
  const shuffled = filteredPosts.sort(() => 0.5 - Math.random());

  // Pick first 5 random posts
  const randomPosts = shuffled.slice(0, 5);

  randomPosts.forEach((p, index) => {

    const colors = ["#0d9488", "#2563eb", "#f97316", "#a855f7", "#ef4444"];
    const color = colors[index % colors.length];

    related.innerHTML += `
      <a href="post.html?slug=${p.slug}" 
         class="related-card"
         style="border-left:5px solid ${color}">

        <div class="related-title">
          ${p.title}
        </div>

        <div class="related-tag" style="color:${color}">
          Read Now →
        </div>

      </a>
    `;
  });
}


function getRandomPosts(array, count) {

  // copy array
  const shuffled = [...array];

  // Fisher-Yates Shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // return random amount
  return shuffled.slice(0, count);
}


async function saveEmail() {
  const email = document.getElementById("emailInput");
  const btn = document.querySelector("button");

  if (!email.value) {
    alert("Please enter email");
    return;
  }

  btn.innerText = "Saving...";
  btn.disabled = true;

  try {
    await db.collection("subscribers").add({
      email: email.value,
      date: new Date()
    });

    // ✅ SHOW SUCCESS FIRST
    btn.innerText = "Subscribed ✔";

    // ✅ FORCE UI TO UPDATE BEFORE CLEARING INPUT
    await new Promise(resolve => setTimeout(resolve, 50));

    setTimeout(() => {
      email.value = ""; // clear AFTER user sees success
      btn.innerText = "Subscribe";
      btn.disabled = false;
    }, 1500);

  } catch (error) {
    btn.innerText = "Subscribe";
    btn.disabled = false;

    alert("Failed to subscribe. Try again.");
    console.log(error);
  }
}




async function loadComments() {

  const container = document.getElementById("commentsContainer");

  if (!container) return;

  const slug = new URLSearchParams(window.location.search).get("slug");

  container.innerHTML = "<p>Loading comments...</p>";

  try {

    const snapshot = await db.collection("comments")
      .where("postSlug", "==", slug)
      .get();

    container.innerHTML = "";

    snapshot.forEach(doc => {

      const c = doc.data();

      container.innerHTML += `
        <div class="comment-card">

          <div class="comment-name">
            ${c.name}
          </div>

          <div class="comment-text">
            ${c.text}
          </div>

          <div class="comment-date">
            ${new Date(c.date.seconds * 1000).toLocaleString()}
          </div>

        </div>
      `;
    });

  } catch (err) {
    console.log(err);
  }
}

async function addComment() {

  const name = document.getElementById("commentName").value;
  const text = document.getElementById("commentText").value;

  const slug = new URLSearchParams(window.location.search).get("slug");

  if (!name || !text) {
    alert("Please fill all fields");
    return;
  }

  try {

    await db.collection("comments").add({
      postSlug: slug,
      name: name,
      text: text,
      date: new Date()
    });

    document.getElementById("commentName").value = "";
    document.getElementById("commentText").value = "";

    loadComments();

  } catch (err) {
    console.log(err);
    alert("Failed to post comment");
  }
}



                
