// ============================================================
// 1. БАЗА ДАННЫХ (localStorage)
// ============================================================
const DB = {
    getUsers: () => JSON.parse(localStorage.getItem('users') || '[]'),
    saveUsers: (u) => localStorage.setItem('users', JSON.stringify(u)),
    getApps: () => JSON.parse(localStorage.getItem('applications') || '[]'),
    saveApps: (a) => localStorage.setItem('applications', JSON.stringify(a)),
    getReviews: () => JSON.parse(localStorage.getItem('reviews') || '[]'),
    saveReviews: (r) => localStorage.setItem('reviews', JSON.stringify(r)),
    getCurrentUser: () => JSON.parse(sessionStorage.getItem('currentUser') || 'null'),
    setCurrentUser: (u) => sessionStorage.setItem('currentUser', JSON.stringify(u)),
    logout: () => {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isAdmin');
    },
    isAdmin: () => sessionStorage.getItem('isAdmin') === 'true',
    setAdmin: (v) => sessionStorage.setItem('isAdmin', v ? 'true' : 'false')
};

// ============================================================
// 2. СПИСОК КУРСОВ
// ============================================================
const COURSES = [
    'Повышение квалификации: Web-разработка',
    'Переподготовка: Информационная безопасность',
    'Охрана труда для руководителей',
    'Охрана труда для специалистов',
    'Повышение квалификации: 1С-программист',
    'Переподготовка: Системный администратор'
];

// ============================================================
// 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function toast(msg, type = '') {
    let t = document.getElementById('globalToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'globalToast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast show ' + type;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.className = 'toast ' + type, 3000);
}

function validateLogin(v) { return /^[A-Za-z0-9]{6,}$/.test(v); }
function validatePassword(v) { return v.length >= 8; }
function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validatePhone(v) { return /^[+\d\s()-]{10,}$/.test(v); }

function requireAuth() {
    if (!DB.getCurrentUser()) {
        toast('Сначала войдите в систему', 'error');
        setTimeout(() => location.href = 'login.html', 800);
        return false;
    }
    return true;
}

function logout() {
    DB.logout();
    toast('Выход выполнен', 'success');
    setTimeout(() => location.href = '../../index.html', 500);
}

// ============================================================
// 4. СЛАЙДЕР
// ============================================================
function initSlider(selector, interval = 3000) {
    const slider = document.querySelector(selector);
    if (!slider) return;

    const track = slider.querySelector('.slider-track');
    const slides = track.querySelectorAll('.slide');
    const prev = slider.querySelector('.prev');
    const next = slider.querySelector('.next');
    const dotsContainer = slider.querySelector('.slider-dots');
    let idx = 0, timer;

    // Создаём точки
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.dataset.index = i;
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('span');

    function show(i) {
        idx = (i + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + (idx * 100) + '%)';
        dots.forEach((d, k) => d.classList.toggle('active', k === idx));
    }

    function auto() {
        clearInterval(timer);
        timer = setInterval(function () { show(idx + 1); }, interval);
    }

    function reset() { clearInterval(timer); auto(); }

    if (prev) prev.addEventListener('click', function () { show(idx - 1); reset(); });
    if (next) next.addEventListener('click', function () { show(idx + 1); reset(); });
    dots.forEach(function (d, k) {
        d.addEventListener('click', function () { show(k); reset(); });
    });

    // Пауза при наведении
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', auto);

    show(0);
    auto();
}

// ============================================================
// 5. РЕГИСТРАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    var regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('name');
            var login = document.getElementById('login');
            var password = document.getElementById('password');
            var phone = document.getElementById('phone');
            var email = document.getElementById('email');

            var valid = true;

            // Валидация
            var fields = [
                { el: name, fn: function (v) { return v.trim().length > 2; }, msg: 'Введите ФИО' },
                { el: login, fn: validateLogin, msg: 'Латинские буквы и цифры, минимум 6 символов' },
                { el: password, fn: validatePassword, msg: 'Пароль должен быть не менее 8 символов' },
                { el: phone, fn: validatePhone, msg: 'Введите корректный номер телефона' },
                { el: email, fn: validateEmail, msg: 'Введите корректный email' }
            ];

            fields.forEach(function (field) {
                var group = field.el.closest('.form-group');
                if (!field.fn(field.el.value)) {
                    group.classList.add('invalid');
                    group.querySelector('.error-msg').textContent = field.msg;
                    valid = false;
                } else {
                    group.classList.remove('invalid');
                }
            });

            if (!valid) return;

            // Проверка уникальности логина
            var users = DB.getUsers();
            if (users.some(function (u) { return u.login === login.value; })) {
                toast('Такой логин уже занят', 'error');
                login.closest('.form-group').classList.add('invalid');
                return;
            }

            // Сохраняем пользователя
            users.push({
                name: name.value.trim(),
                login: login.value,
                password: password.value,
                phone: phone.value,
                email: email.value
            });
            DB.saveUsers(users);
            toast('Регистрация успешна! Теперь можно войти.', 'success');
            setTimeout(function () { location.href = 'login.html'; }, 900);
        });
    }
});

// ============================================================
// 6. ВХОД
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var login = document.getElementById('login');
            var pass = document.getElementById('password');
            var loginGroup = login.closest('.form-group');
            var passGroup = pass.closest('.form-group');

            var valid = true;

            if (!validateLogin(login.value)) {
                loginGroup.classList.add('invalid');
                valid = false;
            } else {
                loginGroup.classList.remove('invalid');
            }

            if (!validatePassword(pass.value)) {
                passGroup.classList.add('invalid');
                valid = false;
            } else {
                passGroup.classList.remove('invalid');
            }

            if (!valid) return;

            var user = DB.getUsers().find(function (u) {
                return u.login === login.value && u.password === pass.value;
            });

            if (user) {
                DB.setCurrentUser(user);
                toast('Добро пожаловать, ' + user.name + '!', 'success');
                setTimeout(function () { location.href = 'profile.html'; }, 600);
            } else {
                toast('Неверный логин или пароль', 'error');
                loginGroup.classList.add('invalid');
                passGroup.classList.add('invalid');
            }
        });

        // Вход для администратора
        var adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.addEventListener('click', function (e) {
                e.preventDefault();
                var login = document.getElementById('login').value;
                var pass = document.getElementById('password').value;

                if (login === 'Admin26' && pass === 'Demo20') {
                    DB.setAdmin(true);
                    DB.setCurrentUser({ login: 'Admin26', name: 'Администратор' });
                    toast('Вход в панель администратора', 'success');
                    setTimeout(function () { location.href = 'admin.html'; }, 500);
                } else {
                    toast('Введите логин Admin26 и пароль Demo20', 'error');
                }
            });
        }
    }
});

// ============================================================
// 7. ЛИЧНЫЙ КАБИНЕТ (profile.html)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.dashboard')) return;

    if (!requireAuth()) return;

    var user = DB.getCurrentUser();
    document.getElementById('welcome').textContent = 'Здравствуйте, ' + user.name + '!';

    // Выход
    var logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Инициализация слайдера в кабинете
    var slider = document.querySelector('.dashboard .slider');
    if (slider) initSlider('.dashboard .slider', 3000);

    // ===== Рендеринг заявок =====
    function renderApps() {
        var apps = DB.getApps().filter(function (a) { return a.userLogin === user.login; });
        var box = document.getElementById('appsList');
        if (!apps.length) {
            box.innerHTML = '<p class="empty-state">Заявок пока нет. <a href="apply.html">Создать заявку</a></p>';
            return;
        }
        box.innerHTML = apps.map(function (a) {
            var statusClass = a.status === 'Новая' ? 'status-new'
                : a.status === 'Идет обучение' ? 'status-active' : 'status-done';
            var isCompleted = a.status === 'Обучение завершено';
            var hasReview = a.review ? true : false;

            var actionsHtml = '';
            if (isCompleted) {
                if (hasReview) {
                    actionsHtml = '<span style="color:var(--success);font-size:13px;">Отзыв оставлен</span>';
                } else {
                    actionsHtml = '<button class="btn btn-success btn-sm review-btn" data-app-id="' + a.id + '">Оставить отзыв</button>';
                }
            } else {
                actionsHtml = '<span class="review-disabled">Отзыв доступен после завершения</span>';
            }

            var reviewHtml = a.review ? '<div class="app-review">"' + a.review + '"</div>' : '';

            return '<div class="application">' +
                '<div class="app-header">' +
                '<span class="app-course">' + a.course + '</span>' +
                '<span class="status ' + statusClass + '">' + a.status + '</span>' +
                '</div>' +
                '<div class="app-details">' +
                '<span>Старт: ' + a.date + '</span>' +
                '<span>' + a.payment + '</span>' +
                '</div>' +
                '<div class="app-actions">' + actionsHtml + '</div>' +
                reviewHtml +
                '</div>';
        }).join('');

        // Обработчики для кнопок "Оставить отзыв"
        document.querySelectorAll('.review-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var appId = parseInt(this.dataset.appId);
                var appsAll = DB.getApps();
                var app = appsAll.find(function (a) { return a.id === appId; });
                if (!app || app.status !== 'Обучение завершено') {
                    toast('Отзыв можно оставить только после завершения обучения', 'error');
                    return;
                }
                var reviewText = prompt('Оставьте ваш отзыв о курсе "' + app.course + '":');
                if (reviewText !== null && reviewText.trim() !== '') {
                    app.review = reviewText.trim();
                    DB.saveApps(appsAll);
                    toast('Отзыв сохранён! Спасибо.', 'success');
                    renderApps();
                    renderReviews();
                }
            });
        });
    }

    // ===== Рендеринг отзывов =====
    function renderReviews() {
        var revs = DB.getReviews().filter(function (r) { return r.userLogin === user.login; });
        var box = document.getElementById('reviewsList');
        if (!box) return;
        box.innerHTML = revs.length
            ? revs.map(function (r) {
                return '<div class="review-item">' +
                    '<div class="review-course">' + r.course + '</div>' +
                    '<div class="review-text">' + r.text + '</div>' +
                    '</div>';
            }).join('')
            : '<p class="small" style="color:#6c757d;">Отзывов пока нет</p>';
    }

    // ===== Форма отзыва (через select) =====
    function renderReviewSelect() {
        var sel = document.getElementById('reviewApp');
        if (!sel) return;
        var apps = DB.getApps().filter(function (a) {
            return a.userLogin === user.login && a.status === 'Обучение завершено' && !a.review;
        });
        sel.innerHTML = apps.length
            ? apps.map(function (a) { return '<option value="' + a.id + '">' + a.course + '</option>'; }).join('')
            : '<option value="">Нет завершённых курсов для отзыва</option>';
        sel.disabled = !apps.length;
    }

    var reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var sel = document.getElementById('reviewApp');
            var text = document.getElementById('reviewText');
            var appId = parseInt(sel.value);
            if (!appId) { toast('Выберите курс', 'error'); return; }

            var appsAll = DB.getApps();
            var app = appsAll.find(function (a) { return a.id === appId; });
            if (!app) { toast('Курс не найден', 'error'); return; }

            var revs = DB.getReviews();
            revs.push({
                id: Date.now(),
                userLogin: user.login,
                course: app.course,
                text: text.value.trim()
            });
            DB.saveReviews(revs);

            // Отмечаем в заявке, что отзыв оставлен
            app.review = text.value.trim();
            DB.saveApps(appsAll);

            toast('Отзыв отправлен! Спасибо.', 'success');
            text.value = '';
            renderReviews();
            renderReviewSelect();
            renderApps();
        });
    }

    renderApps();
    renderReviews();
    renderReviewSelect();
});

// ============================================================
// 8. ОФОРМЛЕНИЕ ЗАЯВКИ (apply.html)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    var applyForm = document.getElementById('applyForm');
    if (!applyForm) return;

    if (!requireAuth()) return;

    var user = DB.getCurrentUser();

    // Заполняем select с курсами
    var courseSel = document.getElementById('course');
    if (courseSel) {
        courseSel.innerHTML = '<option value="">— выберите курс —</option>' +
            COURSES.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    }

    // Маска для даты
    var dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.addEventListener('input', function (e) {
            var v = this.value.replace(/\D/g, '').slice(0, 8);
            if (v.length >= 5) v = v.slice(0, 2) + '.' + v.slice(2, 4) + '.' + v.slice(4);
            else if (v.length >= 3) v = v.slice(0, 2) + '.' + v.slice(2);
            this.value = v;
        });
    }

    applyForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var course = document.getElementById('course').value;
        var date = document.getElementById('date').value;
        var payment = document.getElementById('payment').value;
        var dateOk = /^\d{2}\.\d{2}\.\d{4}$/.test(date);

        var dateGroup = document.getElementById('date').closest('.form-group');
        if (!dateOk) {
            dateGroup.classList.add('invalid');
        } else {
            dateGroup.classList.remove('invalid');
        }

        if (!course || !dateOk || !payment) {
            if (!course) document.getElementById('course').closest('.form-group').classList.add('invalid');
            if (!payment) document.getElementById('payment').closest('.form-group').classList.add('invalid');
            toast('Заполните все поля корректно', 'error');
            return;
        }

        var apps = DB.getApps();
        apps.push({
            id: Date.now(),
            userLogin: user.login,
            userName: user.name,
            course: course,
            date: date,
            payment: payment,
            status: 'Новая',
            review: null
        });
        DB.saveApps(apps);

        toast('Заявка отправлена на согласование!', 'success');
        setTimeout(function () { location.href = 'profile.html'; }, 800);
    });
});

// ============================================================
// 9. АДМИН-ПАНЕЛЬ (admin.html)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.admin-panel')) return;

    // Проверка авторизации админа
    if (!DB.isAdmin()) {
        // Показываем форму входа
        var loginCard = document.getElementById('adminLoginCard');
        var workArea = document.getElementById('adminWorkArea');
        if (loginCard) loginCard.style.display = 'block';
        if (workArea) workArea.style.display = 'none';
    } else {
        document.getElementById('adminLoginCard').style.display = 'none';
        document.getElementById('adminWorkArea').style.display = 'block';
        renderAdminTable();
    }

    // Вход в админку
    var adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var login = document.getElementById('aLogin').value;
            var pass = document.getElementById('aPass').value;

            if (login === 'Admin26' && pass === 'Demo20') {
                DB.setAdmin(true);
                document.getElementById('adminLoginCard').style.display = 'none';
                document.getElementById('adminWorkArea').style.display = 'block';
                toast('Вход выполнен', 'success');
                renderAdminTable();
            } else {
                toast('Неверные учётные данные', 'error');
            }
        });
    }

    // Выход
    var adminLogout = document.querySelector('.admin-logout');
    if (adminLogout) adminLogout.addEventListener('click', logout);

    var sortKey = null, sortAsc = true, page = 1;
    var PER_PAGE = 5;

    function getFiltered() {
        var searchInput = document.getElementById('search');
        var filterSelect = document.getElementById('filterStatus');
        var q = searchInput ? searchInput.value.toLowerCase() : '';
        var st = filterSelect ? filterSelect.value : '';
        var list = DB.getApps();
        if (q) {
            list = list.filter(function (a) {
                return (a.userName || '').toLowerCase().includes(q) ||
                    (a.course || '').toLowerCase().includes(q);
            });
        }
        if (st) {
            list = list.filter(function (a) { return a.status === st; });
        }
        if (sortKey) {
            list.sort(function (a, b) {
                var x = a[sortKey] || '', y = b[sortKey] || '';
                return sortAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
            });
        }
        return list;
    }

    function renderAdminTable() {
        var list = getFiltered();
        var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
        if (page > pages) page = pages;
        var slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
        var body = document.getElementById('appsBody');

        if (!slice.length) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#6c757d;">Заявок не найдено</td></tr>';
        } else {
            body.innerHTML = slice.map(function (a) {
                return '<tr>' +
                    '<td>' + (a.userName || a.userLogin) + '</td>' +
                    '<td>' + a.course + '</td>' +
                    '<td>' + a.date + '</td>' +
                    '<td>' +
                    '<select class="status-sel" data-id="' + a.id + '">' +
                    '<option ' + (a.status === 'Новая' ? 'selected' : '') + '>Новая</option>' +
                    '<option ' + (a.status === 'Идет обучение' ? 'selected' : '') + '>Идет обучение</option>' +
                    '<option ' + (a.status === 'Обучение завершено' ? 'selected' : '') + '>Обучение завершено</option>' +
                    '</select>' +
                    '</td>' +
                    '<td>' +
                    '<button class="btn btn-secondary btn-sm save-status-btn" data-id="' + a.id + '">Обновить</button>' +
                    '</td>' +
                    '</tr>';
            }).join('');
        }

        // Пагинация
        var pag = document.getElementById('pagination');
        pag.innerHTML = '';
        for (var i = 1; i <= pages; i++) {
            var b = document.createElement('button');
            b.textContent = i;
            if (i === page) b.classList.add('active');
            b.onclick = function (i) {
                return function () { page = i; renderAdminTable(); };
            }(i);
            pag.appendChild(b);
        }

        // Обработчики смены статуса
        document.querySelectorAll('.save-status-btn').forEach(function (btn) {
            btn.onclick = function () {
                var id = parseInt(this.dataset.id);
                var sel = document.querySelector('.status-sel[data-id="' + id + '"]');
                var apps = DB.getApps();
                var app = apps.find(function (a) { return a.id === id; });
                if (app && sel) {
                    app.status = sel.value;
                    DB.saveApps(apps);
                    toast('Статус заявки обновлён на "' + app.status + '"', 'success');
                    renderAdminTable();
                }
            };
        });
    }

    // Сортировка
    document.querySelectorAll('th[data-sort]').forEach(function (th) {
        th.onclick = function () {
            var k = this.dataset.sort;
            if (sortKey === k) sortAsc = !sortAsc;
            else { sortKey = k; sortAsc = true; }
            renderAdminTable();
        };
    });

    // Фильтры и поиск
    var searchInput = document.getElementById('search');
    var filterSelect = document.getElementById('filterStatus');
    if (searchInput) searchInput.oninput = function () { page = 1; renderAdminTable(); };
    if (filterSelect) filterSelect.onchange = function () { page = 1; renderAdminTable(); };

    // Экспортируем для перерисовки
    window.renderAdminTable = renderAdminTable;
});