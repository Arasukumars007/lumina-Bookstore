const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// --- 1. BACKEND DATABASE (In-Memory) ---
let books = [
    { id: 1, title: "The God of Small Things", author: "Arundhati Roy", category: "Fiction", price: 599, about: "A lyrical masterpiece set in Kerala." },
    { id: 2, title: "Atomic Habits", author: "James Clear", category: "Self-Help", price: 450, about: "Small changes, remarkable results." },
    { id: 3, title: "Zero to One", author: "Peter Thiel", category: "Business", price: 720, about: "Notes on startups and how to build the future." }
];

// Generate 50 books
for (let i = 4; i <= 50; i++) {
    books.push({
        id: i,
        title: `Lamina Choice Vol. ${i}`,
        author: "Curated Expert",
        category: "General",
        price: 300 + (i * 10),
        about: "A premium selection for the Lamina catalog."
    });
}

// User History Storage
let purchaseHistory = [];

// --- 2. API ENDPOINTS ---
app.get('/api/books', (req, res) => res.json(books));

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@lamina.com' && password === 'admin123') {
        res.json({ success: true, role: 'admin', user: 'Admin' });
    } else if (email && password.length >= 4) {
        res.json({ success: true, role: 'user', user: email.split('@')[0] });
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/api/admin/add', (req, res) => {
    const newBook = { id: Date.now(), ...req.body };
    books.unshift(newBook);
    res.json({ success: true });
});

app.post('/api/purchase', (req, res) => {
    purchaseHistory.push(req.body);
    res.json({ success: true });
});

// --- 3. FRONTEND UI ---
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LAMINA | Premium Full-Stack</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root { --bg: #0a0c10; --card: #161b22; --accent: #238636; --admin-clr: #8957e5; --text: #c9d1d9; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        
        /* Auth */
        #auth-overlay { position: fixed; inset: 0; background: var(--bg); z-index: 1000; display: flex; justify-content: center; align-items: center; }
        .login-box { background: var(--card); padding: 40px; border-radius: 12px; border: 1px solid #30363d; width: 300px; text-align: center; }
        
        /* Nav */
        nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 5%; background: #010409; border-bottom: 1px solid #30363d; position: sticky; top: 0; z-index: 100; }
        .nav-links span { margin-left: 20px; cursor: pointer; font-weight: 600; color: #8b949e; }
        .nav-links span:hover { color: white; }
        .active-link { color: var(--accent) !important; }

        /* Components */
        .container { padding: 30px 5%; max-width: 1200px; margin: 0 auto; }
        .search-bar { width: 100%; padding: 15px; background: #0d1117; border: 1px solid #30363d; color: white; border-radius: 8px; margin-bottom: 30px; font-size: 1rem; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .book-card { background: var(--card); padding: 20px; border-radius: 8px; border: 1px solid #30363d; transition: 0.2s; }
        .book-card:hover { border-color: #8b949e; }
        
        .admin-form { background: #121d2f; padding: 30px; border-radius: 12px; border: 1px solid #1f6feb; margin-bottom: 40px; }
        input, textarea { width: 100%; padding: 10px; margin: 10px 0; background: #0d1117; border: 1px solid #30363d; color: white; border-radius: 6px; }
        
        .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .btn-green { background: var(--accent); color: white; }
        .btn-purple { background: var(--admin-clr); color: white; }
        
        .hidden { display: none !important; }
    </style>
</head>
<body>

    <div id="auth-overlay">
        <div class="login-box">
            <h1 style="color:white">LAMINA</h1>
            <input type="text" id="email" placeholder="Email (admin@lamina.com)">
            <input type="password" id="pass" placeholder="Password (admin123)">
            <button class="btn btn-green" style="width:100%" onclick="login()">Sign In</button>
        </div>
    </div>

    <nav>
        <div style="font-size:1.5rem; font-weight:700; color:white;">LAMINA</div>
        <div class="nav-links">
            <span id="link-store" class="active-link" onclick="showPage('store')">Store</span>
            <span id="link-profile" onclick="showPage('profile')">History/Profile</span>
            <span id="link-admin" class="hidden" onclick="showPage('admin')">Admin Panel</span>
        </div>
    </nav>

    <div class="container">
        <div id="page-store">
            <input type="text" class="search-bar" id="search" placeholder="Search by title, author, or category..." onkeyup="filterBooks()">
            <div class="grid" id="book-grid"></div>
        </div>

        <div id="page-profile" class="hidden">
            <h2>Order History</h2>
            <div id="history-list"></div>
        </div>

        <div id="page-admin" class="hidden">
            <div class="admin-form">
                <h2 style="margin-top:0">Add New Inventory</h2>
                <input type="text" id="adm-t" placeholder="Title">
                <input type="text" id="adm-a" placeholder="Author">
                <input type="number" id="adm-p" placeholder="Price (₹)">
                <textarea id="adm-d" placeholder="Description"></textarea>
                <button class="btn btn-purple" onclick="adminAdd()">Update Store</button>
            </div>
        </div>
    </div>

    <script>
        let allBooks = [];
        let user = null;

        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('pass').value;
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if(data.success) {
                user = data;
                document.getElementById('auth-overlay').classList.add('hidden');
                if(user.role === 'admin') document.getElementById('link-admin').classList.remove('hidden');
                init();
            }
        }

        async function init() {
            const res = await fetch('/api/books');
            allBooks = await res.json();
            renderBooks(allBooks);
        }

        function renderBooks(list) {
            const grid = document.getElementById('book-grid');
            grid.innerHTML = list.map(b => \`
                <div class="book-card">
                    <h3 style="margin:0; color:white;">\${b.title}</h3>
                    <p style="font-size:0.8rem; color:var(--accent)">\${b.author}</p>
                    <p style="font-size:0.9rem;">\${b.about}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; font-size:1.2rem;">₹\${b.price}</span>
                        <button class="btn btn-green" onclick="buyBook('\${b.title}', \${b.price})">Buy</button>
                    </div>
                </div>
            \`).join('');
        }

        function filterBooks() {
            const term = document.getElementById('search').value.toLowerCase();
            const filtered = allBooks.filter(b => 
                b.title.toLowerCase().includes(term) || 
                b.author.toLowerCase().includes(term)
            );
            renderBooks(filtered);
        }

        async function buyBook(title, price) {
            const order = { title, price, date: new Date().toLocaleDateString() };
            await fetch('/api/purchase', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(order)
            });
            alert("Added to History!");
            updateHistory(order);
        }

        function updateHistory(order) {
            const list = document.getElementById('history-list');
            list.innerHTML += \`<div style="padding:10px; border-bottom:1px solid #30363d;">
                <strong>\${order.title}</strong> - ₹\${order.price} <br>
                <small>Purchased on: \${order.date}</small>
            </div>\`;
        }

        async function adminAdd() {
            const book = {
                title: document.getElementById('adm-t').value,
                author: document.getElementById('adm-a').value,
                price: document.getElementById('adm-p').value,
                about: document.getElementById('adm-d').value
            };
            await fetch('/api/admin/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(book)
            });
            alert("Book added to server!");
            init(); // Refresh store
            showPage('store');
        }

        function showPage(pageId) {
            ['store', 'profile', 'admin'].forEach(p => {
                document.getElementById('page-' + p).classList.add('hidden');
                document.getElementById('link-' + p).classList.remove('active-link');
            });
            document.getElementById('page-' + pageId).classList.remove('hidden');
            document.getElementById('link-' + pageId).classList.add('active-link');
        }
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Lamina running at http://localhost:${port}`));