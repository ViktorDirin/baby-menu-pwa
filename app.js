// Глобальные переменные
let currentBaby = null;
let todayProduct = null; // Глобальная переменная для хранения продукта сегодняшнего дня
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Всегда показываем главную страницу при загрузке
    showMainPage();
    updateChildrenList();
    
    // Инициализация мобильных функций
    initMobileFeatures();
});

// Мобильные функции
function initMobileFeatures() {
    // Предотвращение масштабирования при двойном тапе
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Улучшенная навигация назад
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            goBack();
        }
    });
    
    // Обработка URL параметров для быстрого доступа
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'add-baby') {
        showAddBabyPage();
    } else if (action === 'weekly-planner' && currentBaby) {
        showWeeklyPlannerPage();
    }
}

// Управление страницами
function showPage(pageId) {
    // Скрыть все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показать нужную страницу
    document.getElementById(pageId).classList.add('active');
}

// Улучшенная навигация назад
function goBack() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const pageId = activePage.id;
    
    switch(pageId) {
        case 'add-baby-page':
        case 'baby-page':
        case 'products-page':
        case 'weekly-planner-page':
            showMainPage();
            break;
        case 'main-page':
            // На главной странице ничего не делаем
            break;
        default:
            showMainPage();
    }
}

function showMainPage() {
    showPage('main-page');
    updateChildrenList();
}

function showAddBabyPage() {
    showPage('add-baby-page');
    // Очистить форму
    document.getElementById('add-baby-form').reset();
}

function showBabyPage() {
    if (!currentBaby) return;
    showPage('baby-page');
    updateBabyPage();
}

function showProductsPage() {
    if (!currentBaby) return;
    showPage('products-page');
    updateProductsList();
    updatePopularProducts();
    initProductAutocomplete();
}

function showWeeklyPlannerPage() {
    if (!currentBaby) return;
    showPage('weekly-planner-page');
    updateWeeklyPlanner();
}

function showSettingsPage() {
    showPage('settings-page');
    updateLastUpdatedTime();
}

// Категории продуктов
const PRODUCT_CATEGORIES = {
    'fruits': {
        name: 'Fruits',
        color: '#10b981',
        icon: '🍎',
        minAge: 4,
        products: [
            'Apple', 'Banana', 'Pear', 'Peach', 'Apricot', 'Plum', 'Grape', 
            'Strawberry', 'Raspberry', 'Blueberry', 'Orange', 'Mandarin', 
            'Lemon', 'Kiwi', 'Pineapple', 'Melon', 'Watermelon', 'Cherry',
            'Cranberry', 'Blackberry', 'Pomegranate', 'Mango', 'Papaya'
        ]
    },
    'vegetables': {
        name: 'Vegetables', 
        color: '#059669',
        icon: '🥕',
        minAge: 4,
        products: [
            'Carrot', 'Broccoli', 'Zucchini', 'Potato', 'Beetroot', 'Pumpkin', 
            'Cabbage', 'Tomato', 'Cucumber', 'Cauliflower', 'Eggplant', 
            'Bell Pepper', 'Onion', 'Garlic', 'Spinach', 'Lettuce', 'Radish',
            'Turnip', 'Sweet Potato', 'Green Beans', 'Peas', 'Corn'
        ]
    },
    'grains': {
        name: 'Grains & Cereals',
        color: '#d97706',
        icon: '🌾',
        minAge: 4,
        products: [
            'Rice', 'Buckwheat', 'Oatmeal', 'Millet', 'Corn', 'Barley', 
            'Wheat', 'Rye', 'Quinoa', 'Bulgur', 'Semolina', 'Pearl Barley',
            'Brown Rice', 'Wild Rice', 'Amaranth', 'Spelt'
        ]
    },
    'proteins': {
        name: 'Proteins',
        color: '#dc2626',
        icon: '🥩',
        minAge: 6,
        products: [
            'Chicken', 'Turkey', 'Beef', 'Pork', 'Fish', 'Eggs', 'Cottage Cheese',
            'Yogurt', 'Kefir', 'Cheese', 'Tofu', 'Lentils', 'Beans', 'Chickpeas',
            'Salmon', 'Cod', 'Tuna', 'Shrimp', 'Lamb'
        ]
    },
    'dairy': {
        name: 'Dairy',
        color: '#7c3aed',
        icon: '🥛',
        minAge: 6,
        products: [
            'Milk', 'Kefir', 'Yogurt', 'Cottage Cheese', 'Cheese', 'Sour Cream', 
            'Butter', 'Cream Cheese', 'Ricotta', 'Mozzarella', 'Cheddar',
            'Goat Cheese', 'Feta', 'Greek Yogurt'
        ]
    },
    'other': {
        name: 'Other',
        color: '#6b7280',
        icon: '🍯',
        minAge: 4,
        products: [
            'Honey', 'Nuts', 'Dried Fruits', 'Herbs', 'Spices', 'Vegetable Oil',
            'Olive Oil', 'Coconut Oil', 'Seeds', 'Raisins', 'Dates', 'Figs',
            'Almonds', 'Walnuts', 'Pecans', 'Coconut', 'Avocado'
        ]
    }
};

// Управление данными
function loadData() {
    const data = localStorage.getItem('babyMenuData');
    if (data) {
        return JSON.parse(data);
    }
    return {
        children: [],
        products: {},
        productCategories: {}, // Новое поле для категорий продуктов
        menus: {},
        weeklyPlans: {}, // Хранит ручные изменения для каждого ребенка
        currentBabyId: null // ID текущего выбранного ребенка
    };
}

function saveData(data) {
    localStorage.setItem('babyMenuData', JSON.stringify(data));
}

// Сохраняем текущего ребенка
function saveCurrentBaby(babyId) {
    const data = getData();
    data.currentBabyId = babyId;
    saveData(data);
}

// Восстанавливаем текущего ребенка
function restoreCurrentBaby() {
    const data = getData();
    if (data.currentBabyId) {
        const baby = data.children.find(child => child.id === data.currentBabyId);
        if (baby) {
            currentBaby = baby;
            return true;
        }
    }
    return false;
}

function getData() {
    return loadData();
}

// Управление детьми
function addBaby(event) {
    event.preventDefault();
    
    const name = document.getElementById('baby-name').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const birthDate = document.getElementById('baby-birthdate').value;
    
    if (!name || !gender || !birthDate) {
        showAlert('Required Fields', 'Please fill in all fields');
        return;
    }
    
    // Автоматическая капитализация имени
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
    const data = getData();
    const newBaby = {
        id: Date.now(),
        name: capitalizedName,
        gender: gender,
        birthDate: birthDate,
        createdAt: new Date().toISOString()
    };
    
    data.children.push(newBaby);
    data.products[newBaby.id] = [];
    data.menus[newBaby.id] = {};
    
    saveData(data);
    
    // Показать страницу ребенка
    currentBaby = newBaby;
    saveCurrentBaby(newBaby.id); // Сохраняем нового ребенка
    showBabyPage();
    
    showAlert('Success!', 'Baby added successfully!');
}

function updateChildrenList() {
    const data = getData();
    const childrenList = document.getElementById('children-list');
    
    if (data.children.length === 0) {
        childrenList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No children added yet</p>';
        return;
    }
    
    childrenList.innerHTML = data.children.map(child => `
        <div class="child-card ${child.gender}-card">
            <div class="child-main" onclick="selectBaby(${child.id})">
                <div class="child-avatar ${child.gender}-avatar">${child.gender === 'boy' ? '👦' : '👧'}</div>
                <div class="child-info">
                    <h3>${child.name}</h3>
                    <p>Age: ${calculateAge(child.birthDate)}</p>
                </div>
            </div>
            <button class="remove-baby-btn" onclick="event.stopPropagation(); removeBaby(${child.id})" title="Remove Baby">
                🗑️
            </button>
        </div>
    `).join('');
}

function selectBaby(babyId) {
    const data = getData();
    currentBaby = data.children.find(child => child.id === babyId);
    if (currentBaby) {
        saveCurrentBaby(babyId); // Сохраняем выбранного ребенка
        showBabyPage();
    }
}

function removeBaby(babyId) {
    const data = getData();
    const baby = data.children.find(child => child.id === babyId);
    
    if (!baby) return;
    
    // Показываем модальное окно с предупреждением
    showModal(
        'Remove Baby',
        `Are you sure you want to remove "${baby.name}"?\n\nThis will permanently delete:\n• All products\n• Weekly meal plans\n• All feeding history\n\nThis action cannot be undone!`,
        () => {
            // Подтверждение удаления
            continueRemoveBaby(babyId);
        },
        () => {
            // Отмена удаления
            console.log('Baby removal cancelled');
        }
    );
}

function continueRemoveBaby(babyId) {
    const data = getData();
    const babyIndex = data.children.findIndex(child => child.id === babyId);
    
    if (babyIndex === -1) return;
    
    const baby = data.children[babyIndex];
    
    // Удаляем ребенка из списка
    data.children.splice(babyIndex, 1);
    
    // Удаляем все связанные данные
    delete data.products[babyId];
    delete data.productCategories[babyId];
    delete data.menus[babyId];
    delete data.weeklyPlans[babyId];
    
    // Если удаляемый ребенок был текущим, сбрасываем currentBaby
    if (currentBaby && currentBaby.id === babyId) {
        currentBaby = null;
        data.currentBabyId = null;
        
        // Если есть другие дети, выбираем первого
        if (data.children.length > 0) {
            currentBaby = data.children[0];
            data.currentBabyId = currentBaby.id;
        }
    }
    
    // Сохраняем изменения
    saveData(data);
    
    // Обновляем интерфейс
    updateChildrenList();
    
    // Если удалили текущего ребенка, показываем главную страницу
    if (!currentBaby) {
        showMainPage();
    } else {
        // Если есть другие дети, показываем страницу выбранного ребенка
        showBabyPage();
    }
    
    showAlert('Baby Removed', `"${baby.name}" has been successfully removed from the planner.`);
}

function calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = Math.floor((today - birth) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (ageInMonths < 12) {
        return `${ageInMonths} мес.`;
    } else {
        const years = Math.floor(ageInMonths / 12);
        const months = ageInMonths % 12;
        return months > 0 ? `${years}г. ${months}м.` : `${years}г.`;
    }
}

function updateBabyPage() {
    if (!currentBaby) return;
    
    document.getElementById('baby-page-title').textContent = currentBaby.name;
    document.getElementById('baby-avatar').textContent = currentBaby.gender === 'boy' ? '👦' : '👧';
    document.getElementById('baby-name-display').textContent = currentBaby.name;
    document.getElementById('baby-age').textContent = `Age: ${calculateAge(currentBaby.birthDate)}`;
    
    // Apply gender-based color theme
    applyGenderTheme(currentBaby.gender);
    
    updateWeeklyPlanner(); // Сначала обновляем планировщик, чтобы сохранить todayProduct
    updateTodayProduct(); // Потом обновляем страницу ребенка
}

function applyGenderTheme(gender) {
    const themeClass = gender === 'boy' ? 'boy-theme' : 'girl-theme';
    
    // Apply theme to baby info section
    const babyInfo = document.querySelector('.baby-info');
    if (babyInfo) {
        babyInfo.className = 'baby-info ' + themeClass;
    }
    
    // Apply theme to today menu section
    const todayMenu = document.querySelector('.today-menu');
    if (todayMenu) {
        todayMenu.className = 'today-menu ' + themeClass;
    }
    
    // Apply theme to action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.className = 'action-btn ' + themeClass;
    });
}

function updateTodayProduct() {
    if (!currentBaby) return;
    
    const data = getData();
    const products = data.products[currentBaby.id] || [];
    
    
    if (products.length === 0) {
        document.getElementById('today-product').innerHTML = `
            <span class="product-emoji">📝</span>
            <span class="product-name">Add products</span>
        `;
        return;
    }
    
    // Если todayProduct не установлен, вычисляем его
    let product;
    if (todayProduct) {
        product = todayProduct;
    } else {
        // Вычисляем продукт для сегодняшнего дня
        const today = new Date().toISOString().split('T')[0];
        const weeklyPlan = data.weeklyPlans && data.weeklyPlans[currentBaby.id] || {};
        
        if (weeklyPlan[today]) {
            product = weeklyPlan[today];
        } else {
            const productIndex = getProductIndexForDate(today, products.length);
            product = products[productIndex];
        }
    }
    
    document.getElementById('today-product').innerHTML = `
        <span class="product-emoji">${getProductEmoji(product)}</span>
        <span class="product-name">${product}</span>
    `;
}

function getProductIndexForDate(dateString, productCount) {
    const date = new Date(dateString);
    
    if (productCount === 0) return 0;
    if (productCount === 1) return 0;
    
    // Вычисляем количество дней с эпохи
    const epoch = new Date('2024-01-01');
    const daysSinceEpoch = Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
    
    // Вычисляем неделю и день в неделе
    const week = Math.floor(daysSinceEpoch / 7);
    const dayInWeek = daysSinceEpoch % 7;
    
    // Умная формула: учитываем неделю и день, чтобы все продукты попадали в рацион
    return (week * 7 + dayInWeek) % productCount;
}

function getProductEmoji(product) {
    const emojiMap = {
        'яблоко': '🍎',
        'банан': '🍌',
        'груша': '🍐',
        'морковь': '🥕',
        'брокколи': '🥦',
        'кабачок': '🥒',
        'картофель': '🥔',
        'свекла': '🍠',
        'тыква': '🎃',
        'капуста': '🥬',
        'помидор': '🍅',
        'огурец': '🥒',
        'персик': '🍑',
        'абрикос': '🍑',
        'слива': '🍇',
        'виноград': '🍇',
        'клубника': '🍓',
        'малина': '🫐',
        'черника': '🫐',
        'апельсин': '🍊',
        'мандарин': '🍊',
        'лимон': '🍋',
        'грейпфрут': '🍊',
        'киви': '🥝',
        'ананас': '🍍',
        'дыня': '🍈',
        'арбуз': '🍉'
    };
    
    const lowerProduct = product.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
        if (lowerProduct.includes(key)) {
            return emoji;
        }
    }
    return '🥄'; // Дефолтная иконка
}

// Управление продуктами
function addProduct() {
    const input = document.getElementById('new-product');
    const categorySelect = document.getElementById('product-category');
    const productName = input.value.trim();
    const category = categorySelect.value;
    
    if (!productName) {
        showAlert('Required Field', 'Enter product name');
        return;
    }
    
    if (!currentBaby) {
        showAlert('No Baby Selected', 'Please select a baby first');
        return;
    }
    
    // Проверяем возраст введения
    const babyAge = calculateBabyAge(currentBaby.birthDate);
    const categoryInfo = PRODUCT_CATEGORIES[category];
    
    if (babyAge < categoryInfo.minAge) {
        showAlert('Age Restriction', 
            `This product category is recommended for babies ${categoryInfo.minAge}+ months. Your baby is ${babyAge} months old.`);
        return;
    }
    
    const data = getData();
    if (!data.products[currentBaby.id]) {
        data.products[currentBaby.id] = [];
    }
    if (!data.productCategories[currentBaby.id]) {
        data.productCategories[currentBaby.id] = {};
    }
    
    if (data.products[currentBaby.id].includes(productName)) {
        showAlert('Duplicate Product', 'This product is already added');
        return;
    }
    
    // Проверяем, есть ли ручные изменения в планировщике
    const hasManualChanges = data.weeklyPlans && data.weeklyPlans[currentBaby.id] && 
        Object.keys(data.weeklyPlans[currentBaby.id]).length > 0;
    
    if (hasManualChanges) {
        showModal(
            'Recalculate Week?', 
            'You have manual changes in your weekly planner. Do you want to recalculate the week with the new product?',
            () => {
                // Пересчитываем неделю с новым продуктом
                recalculateWeekWithNewProduct(data, currentBaby.id);
            }
        );
    }
    
    data.products[currentBaby.id].push(productName);
    data.productCategories[currentBaby.id][productName] = category;
    saveData(data);
    
    input.value = '';
    updateProductsList();
    updateTodayProduct();
    
    // Скрываем предложения после добавления
    const suggestionsContainer = document.getElementById('product-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('show');
    }
    
    // Обновляем планировщик на неделю, если он открыт
    if (document.getElementById('weekly-planner-page').classList.contains('active')) {
        updateWeeklyPlanner();
    }
    
    showAlert('Success!', 'Product added!');
}

function deleteProduct(productName) {
    if (!currentBaby) return;
    
    showModal(
        'Delete Product', 
        `Are you sure you want to delete "${productName}"?`,
        () => {
            // Продолжаем с удалением
            continueDeleteProduct(productName);
        }
    );
}

function continueDeleteProduct(productName) {
    if (!currentBaby) return;
    
    const data = getData();
    if (data.products[currentBaby.id]) {
        // Проверяем, есть ли ручные изменения в планировщике
        const hasManualChanges = data.weeklyPlans && data.weeklyPlans[currentBaby.id] && 
            Object.keys(data.weeklyPlans[currentBaby.id]).length > 0;
        
        if (hasManualChanges) {
            showModal(
                'Recalculate Week?', 
                'You have manual changes in your weekly planner. Do you want to recalculate the week after removing this product?',
                () => {
                    // Пересчитываем неделю после удаления продукта
                    recalculateWeekAfterProductRemoval(data, currentBaby.id, productName);
                }
            );
        }
        
    data.products[currentBaby.id] = data.products[currentBaby.id].filter(p => p !== productName);
    if (data.productCategories[currentBaby.id]) {
        delete data.productCategories[currentBaby.id][productName];
    }
    saveData(data);
    updateProductsList();
    updateTodayProduct();
    
    // Обновляем планировщик на неделю, если он открыт
    if (document.getElementById('weekly-planner-page').classList.contains('active')) {
        updateWeeklyPlanner();
    }
    }
}

function recalculateWeekWithNewProduct(data, babyId) {
    if (!data.weeklyPlans) {
        data.weeklyPlans = {};
    }
    if (!data.weeklyPlans[babyId]) {
        data.weeklyPlans[babyId] = {};
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = getWeekStart(today);
    
    // Пересчитываем только будущие дни (начиная с завтра)
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Пересчитываем только будущие дни
        if (date >= tomorrow) {
            const productIndex = getProductIndexForDate(dateString, data.products[babyId].length);
            data.weeklyPlans[babyId][dateString] = data.products[babyId][productIndex];
        }
    }
}

function recalculateWeekAfterProductRemoval(data, babyId, removedProduct) {
    if (!data.weeklyPlans) {
        data.weeklyPlans = {};
    }
    if (!data.weeklyPlans[babyId]) {
        data.weeklyPlans[babyId] = {};
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = getWeekStart(today);
    
    // Пересчитываем только будущие дни (начиная с завтра)
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        // Пересчитываем только будущие дни
        if (date >= tomorrow) {
            if (data.products[babyId].length > 0) {
                const productIndex = getProductIndexForDate(dateString, data.products[babyId].length);
                data.weeklyPlans[babyId][dateString] = data.products[babyId][productIndex];
            } else {
                // Если продуктов нет, удаляем запись
                delete data.weeklyPlans[babyId][dateString];
            }
        }
    }
}

function updateProductsList() {
    if (!currentBaby) return;
    
    const data = getData();
    const products = data.products[currentBaby.id] || [];
    const productCategories = data.productCategories[currentBaby.id] || {};
    const productsList = document.getElementById('products-list');
    
    if (products.length === 0) {
        productsList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No products added yet</p>';
        return;
    }
    
    productsList.innerHTML = products.map(product => {
        const category = productCategories[product] || 'other';
        const categoryInfo = PRODUCT_CATEGORIES[category];
        return `
            <div class="product-item" style="border-left: 4px solid ${categoryInfo.color}">
                <div class="product-info">
                    <span class="product-emoji">${categoryInfo.icon}</span>
                    <span class="product-name">${product}</span>
                    <span class="product-category" style="color: ${categoryInfo.color}">${categoryInfo.name}</span>
                </div>
                <button class="delete-product-btn" onclick="deleteProduct('${product}')">Delete</button>
            </div>
        `;
    }).join('');
}

// Автодополнение для продуктов
function initProductAutocomplete() {
    const productInput = document.getElementById('new-product');
    const suggestionsContainer = document.getElementById('product-suggestions');
    const categorySelect = document.getElementById('product-category');
    
    if (!productInput || !suggestionsContainer) return;
    
    // Обработчик ввода
    productInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const category = categorySelect.value;
        
        if (query.length < 1) {
            suggestionsContainer.classList.remove('show');
            return;
        }
        
        // Получаем продукты для текущей категории
        const categoryProducts = PRODUCT_CATEGORIES[category].products || [];
        
        // Фильтруем продукты по запросу
        const filteredProducts = categoryProducts.filter(product => 
            product.toLowerCase().includes(query)
        );
        
        // Показываем предложения
        showSuggestions(filteredProducts, query);
    });
    
    // Обработчик фокуса
    productInput.addEventListener('focus', function() {
        if (this.value.length >= 1) {
            const category = categorySelect.value;
            const categoryProducts = PRODUCT_CATEGORIES[category].products || [];
            const query = this.value.toLowerCase().trim();
            const filteredProducts = categoryProducts.filter(product => 
                product.toLowerCase().includes(query)
            );
            showSuggestions(filteredProducts, query);
        }
    });
    
    // Скрываем предложения при потере фокуса
    productInput.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsContainer.classList.remove('show');
        }, 200);
    });
    
    // Обработчик выбора предложения
    suggestionsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('suggestion-item')) {
            productInput.value = e.target.textContent;
            suggestionsContainer.classList.remove('show');
            productInput.focus();
        }
    });
    
    // Обработчик смены категории
    categorySelect.addEventListener('change', function() {
        suggestionsContainer.classList.remove('show');
        updatePopularProducts();
    });
}

function showSuggestions(products, query) {
    const suggestionsContainer = document.getElementById('product-suggestions');
    
    if (products.length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    const suggestionsHTML = products.map(product => {
        const highlightedProduct = product.replace(
            new RegExp(`(${query})`, 'gi'), 
            '<strong>$1</strong>'
        );
        return `<div class="suggestion-item">${highlightedProduct}</div>`;
    }).join('');
    
    suggestionsContainer.innerHTML = suggestionsHTML;
    suggestionsContainer.classList.add('show');
}

// Обновление популярных продуктов
function updatePopularProducts() {
    const categorySelect = document.getElementById('product-category');
    const popularProductsList = document.getElementById('popular-products-list');
    
    if (!categorySelect || !popularProductsList) return;
    
    const category = categorySelect.value;
    const categoryInfo = PRODUCT_CATEGORIES[category];
    const products = categoryInfo.products || [];
    
    // Показываем первые 12 продуктов
    const popularProducts = products.slice(0, 12);
    
    popularProductsList.innerHTML = popularProducts.map(product => `
        <div class="popular-product-item" onclick="selectPopularProduct('${product}')">
            ${product}
        </div>
    `).join('');
}

function selectPopularProduct(productName) {
    const productInput = document.getElementById('new-product');
    const categorySelect = document.getElementById('product-category');
    
    if (productInput) {
        productInput.value = productName;
        productInput.focus();
    }
    
    // Убираем выделение с других элементов
    document.querySelectorAll('.popular-product-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Выделяем выбранный элемент
    event.target.classList.add('selected');
    
    // Скрываем предложения
    const suggestionsContainer = document.getElementById('product-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('show');
    }
}

// Планировщик на неделю
function updateWeeklyPlanner() {
    if (!currentBaby) return;
    
    const data = getData();
    const products = data.products[currentBaby.id] || [];
    const weeklyPlan = data.weeklyPlans[currentBaby.id] || {};
    
    // Обновляем информацию о неделе
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    
    const currentWeekElement = document.getElementById('current-week');
    if (currentWeekElement) {
        currentWeekElement.textContent = 
            `Week of ${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;
    }
    
    // Создаем карточки дней
    const weeklyMenu = document.getElementById('weekly-menu');
    if (!weeklyMenu) {
        console.error('weekly-menu element not found');
        return;
    }
    
    let weeklyHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === today.toDateString();
        
        // Определяем продукт для дня
        let product, isManual = false;
        if (weeklyPlan[dateString]) {
            // Ручное изменение
            product = weeklyPlan[dateString];
            isManual = true;
        } else if (products.length > 0) {
            // Автоматическое планирование
            const productIndex = getProductIndexForDate(dateString, products.length);
            product = products[productIndex];
        } else {
            product = 'No products added';
        }
        
        // Сохраняем продукт для сегодняшнего дня
        if (isToday) {
            todayProduct = product;
        }
        
        const dayName = getDayName(date);
        const dayDate = formatDateShort(date);
        const data = getData();
        const productCategories = data.productCategories[currentBaby.id] || {};
        const category = productCategories[product] || 'other';
        const categoryInfo = PRODUCT_CATEGORIES[category];
        
        let cardClasses = 'day-card';
        if (isToday) cardClasses += ' today';
        if (isManual) cardClasses += ' manual';
        
        weeklyHTML += `
            <div class="${cardClasses}" onclick="editDayProduct('${dateString}')" style="border-left: 4px solid ${categoryInfo.color}">
                <div class="day-header">
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${dayDate}</div>
                </div>
                <div class="day-product ${isManual ? 'manual' : 'auto'}">
                    <span class="product-emoji-small">${categoryInfo.icon}</span>
                    <span class="product-name">${product}</span>
                    <span class="product-category-small" style="color: ${categoryInfo.color}">${categoryInfo.name}</span>
                </div>
            </div>
        `;
    }
    
    weeklyMenu.innerHTML = weeklyHTML;
}

function getWeekStart(date) {
    const day = date.getDay();
    // Находим воскресенье текущей недели (американская система)
    // Система: 0=воскресенье, 1=понедельник, 2=вторник...
    // Нам нужно: 0=воскресенье, 1=понедельник, 2=вторник...
    
    let daysBack;
    if (day === 0) { // Воскресенье - не идем назад
        daysBack = 0;
    } else { // Понедельник=1, Вторник=2, и т.д. - идем назад на day дней
        daysBack = day;
    }
    
    // Используем более надежный метод - создаем новую дату с правильным расчетом
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysBack);
    weekStart.setHours(0, 0, 0, 0);
    
    return weekStart;
}

function getDayName(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function formatDateShort(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function editDayProduct(dateString) {
    if (!currentBaby) return;
    
    const data = getData();
    const products = data.products[currentBaby.id] || [];
    
    if (products.length === 0) {
        showAlert('No Products', 'Please add products first!');
        return;
    }
    
    // Создаем список продуктов для выбора
    let options = products.map((product, index) => 
        `${index + 1}. ${product}`
    ).join('\n');
    
    showPrompt(
        'Choose Product', 
        `Choose product for ${dateString}:\n\n${options}`,
        `Enter number (1-${products.length})`,
        (choice) => {
            if (choice === null || choice === '') {
                // Удаляем ручную настройку
                if (data.weeklyPlans && data.weeklyPlans[currentBaby.id]) {
                    delete data.weeklyPlans[currentBaby.id][dateString];
                    saveData(data);
                    updateWeeklyPlanner();
                    updateTodayProduct(); // Обновляем "Today give"
                }
                return;
            }
            
            const productIndex = parseInt(choice) - 1;
            if (productIndex >= 0 && productIndex < products.length) {
                // Сохраняем ручную настройку
                if (!data.weeklyPlans) {
                    data.weeklyPlans = {};
                }
                if (!data.weeklyPlans[currentBaby.id]) {
                    data.weeklyPlans[currentBaby.id] = {};
                }
                data.weeklyPlans[currentBaby.id][dateString] = products[productIndex];
                saveData(data);
                updateWeeklyPlanner();
                updateTodayProduct(); // Обновляем "Today give"
            } else {
                showAlert('Invalid Choice', 'Please enter a valid number!');
            }
        },
        () => {
            // Удаляем ручную настройку при отмене
            if (data.weeklyPlans && data.weeklyPlans[currentBaby.id]) {
                delete data.weeklyPlans[currentBaby.id][dateString];
                saveData(data);
                updateWeeklyPlanner();
                updateTodayProduct(); // Обновляем "Today give"
            }
        }
    );
}

function resetToAutomatic() {
    if (!currentBaby) return;
    
    showModal(
        'Reset to Automatic', 
        'Are you sure you want to reset all manual changes to automatic planning?',
        () => {
            // Продолжаем с сбросом
            continueResetToAutomatic();
        }
    );
}

function continueResetToAutomatic() {
    if (!currentBaby) return;
    
    const data = getData();
    
    // Полностью очищаем ручные изменения
    if (data.weeklyPlans && data.weeklyPlans[currentBaby.id]) {
        delete data.weeklyPlans[currentBaby.id];
    }
    
    saveData(data);
    updateWeeklyPlanner();
    updateTodayProduct(); // Обновляем "Today give"
    showAlert('Success!', 'Reset to automatic planning!');
}

function fillWeekAutomatically() {
    if (!currentBaby) return;
    
    const data = getData();
    const products = data.products[currentBaby.id] || [];
    
    if (products.length === 0) {
        showAlert('No Products', 'Please add products first!');
        return;
    }
    
    // Очищаем все ручные изменения - это заставит показывать автоматические
    if (data.weeklyPlans && data.weeklyPlans[currentBaby.id]) {
        delete data.weeklyPlans[currentBaby.id];
    }

    // А теперь заполняем всю неделю автоматически
    recalculateEntireWeek(data, currentBaby.id); // <-- Добавляем эту строку
    
    saveData(data);
    updateWeeklyPlanner();
    updateTodayProduct(); // Обновляем "Today give"
    showAlert('Success!', 'Week filled automatically!');
}

// Пересчитывает всю неделю с умным алгоритмом
function recalculateEntireWeek(data, babyId) {
    const products = data.products[babyId] || [];
    if (products.length === 0) return;
    
    // Убеждаемся, что weeklyPlans существует
    if (!data.weeklyPlans) {
        data.weeklyPlans = {};
    }
    if (!data.weeklyPlans[babyId]) {
        data.weeklyPlans[babyId] = {};
    }
    
    const weekStart = getWeekStart(new Date());
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateString = formatDate(date);
        const productIndex = getProductIndexForDate(dateString, products.length);
        data.weeklyPlans[babyId][dateString] = products[productIndex];
    }
}

// Утилиты
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function calculateBabyAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                       (today.getMonth() - birth.getMonth());
    return Math.max(0, ageInMonths);
}

// Умный алгоритм распределения продуктов
function getSmartProductForDay(date, products) {
    if (!products || products.length === 0) {
        return 'No products added';
    }
    
    if (products.length === 1) {
        return products[0];
    }
    
    // Вычисляем количество дней с эпохи
    const epoch = new Date('2024-01-01');
    const daysSinceEpoch = Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
    
    // Вычисляем неделю и день в неделе
    const week = Math.floor(daysSinceEpoch / 7);
    const dayInWeek = daysSinceEpoch % 7;
    
    // Умная формула: учитываем неделю и день, чтобы все продукты попадали в рацион
    const productIndex = (week * 7 + dayInWeek) % products.length;
    
    return products[productIndex];
}

// Кастомные модальные окна
function showModal(title, message, onConfirm, onCancel) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    modal.classList.add('show');
    
    const handleConfirm = () => {
        modal.classList.remove('show');
        if (onConfirm) onConfirm();
        cleanup();
    };
    
    const handleCancel = () => {
        modal.classList.remove('show');
        if (onCancel) onCancel();
        cleanup();
    };
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleBackdrop);
    };
    
    const handleBackdrop = (e) => {
        if (e.target === modal) {
            handleCancel();
        }
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleBackdrop);
}

function showAlert(title, message, onOk) {
    const modal = document.getElementById('custom-alert');
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    const okBtn = document.getElementById('alert-ok');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    modal.classList.add('show');
    
    const handleOk = () => {
        modal.classList.remove('show');
        if (onOk) onOk();
        cleanup();
    };
    
    const cleanup = () => {
        okBtn.removeEventListener('click', handleOk);
        modal.removeEventListener('click', handleBackdrop);
    };
    
    const handleBackdrop = (e) => {
        if (e.target === modal) {
            handleOk();
        }
    };
    
    okBtn.addEventListener('click', handleOk);
    modal.addEventListener('click', handleBackdrop);
}

function showPrompt(title, message, placeholder, onConfirm, onCancel) {
    const modal = document.getElementById('custom-prompt');
    const titleEl = document.getElementById('prompt-title');
    const messageEl = document.getElementById('prompt-message');
    const inputEl = document.getElementById('prompt-input');
    const confirmBtn = document.getElementById('prompt-confirm');
    const cancelBtn = document.getElementById('prompt-cancel');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.placeholder = placeholder || 'Enter value...';
    inputEl.value = '';
    
    modal.classList.add('show');
    inputEl.focus();
    
    const handleConfirm = () => {
        const value = inputEl.value.trim();
        modal.classList.remove('show');
        if (onConfirm) onConfirm(value);
        cleanup();
    };
    
    const handleCancel = () => {
        modal.classList.remove('show');
        if (onCancel) onCancel();
        cleanup();
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        inputEl.removeEventListener('keypress', handleKeyPress);
        modal.removeEventListener('click', handleBackdrop);
    };
    
    const handleBackdrop = (e) => {
        if (e.target === modal) {
            handleCancel();
        }
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    inputEl.addEventListener('keypress', handleKeyPress);
    modal.addEventListener('click', handleBackdrop);
}

// PWA Installation
let deferredPrompt;
let isInstalled = false;

// Check if app is already installed
function checkIfInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        isInstalled = true;
        return true;
    }
    return false;
}

// Show install options based on browser support
function showInstallOptions() {
    const installBtn = document.getElementById('install-btn');
    const installInfo = document.getElementById('install-info');
    
    if (checkIfInstalled()) {
        // App is already installed, hide install options
        if (installBtn) installBtn.style.display = 'none';
        if (installInfo) installInfo.style.display = 'none';
        return;
    }
    
    // Check if browser supports PWA installation
    if (deferredPrompt) {
        // Browser supports beforeinstallprompt
        if (installBtn) installBtn.style.display = 'block';
        if (installInfo) installInfo.style.display = 'none';
    } else {
        // Show manual install instructions
        if (installBtn) installBtn.style.display = 'none';
        if (installInfo) installInfo.style.display = 'block';
    }
}

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA: beforeinstallprompt event fired');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install options
    showInstallOptions();
});

// PWA Install button handler
const installBtn = document.getElementById('install-btn');
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            try {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`PWA: User response to the install prompt: ${outcome}`);
                
                if (outcome === 'accepted') {
                    showAlert('Installing...', 'The app is being installed on your device!');
                }
                
                // Clear the deferredPrompt
                deferredPrompt = null;
                // Hide the install button
                installBtn.style.display = 'none';
            } catch (error) {
                console.error('PWA: Install prompt failed:', error);
                showAlert('Install Failed', 'Unable to install the app. Please try using the browser menu.');
            }
        }
    });
}

// Check install status on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the page to fully load
    setTimeout(() => {
        showInstallOptions();
    }, 1000);
});

// Handle Enter in product input
const newProductInput = document.getElementById('new-product');
if (newProductInput) {
    newProductInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addProduct();
        }
    });
}

// Handle app installed
window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was installed');
    showAlert('App Installed!', 'Baby Menu has been installed on your device!');
});

// Settings page functions
function updateLastUpdatedTime() {
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        const now = new Date();
        const timeString = now.toLocaleString();
        lastUpdatedElement.textContent = timeString;
    }
}

// Force update app function
async function forceUpdateApp() {
    try {
        // Show loading state
        const updateBtn = document.querySelector('.update-app-btn');
        const originalText = updateBtn.innerHTML;
        updateBtn.innerHTML = '<span class="btn-icon">⏳</span> Updating...';
        updateBtn.disabled = true;
        
        // Check if service worker is supported
        if ('serviceWorker' in navigator) {
            // Get all service worker registrations
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            // Unregister all service workers
            for (let registration of registrations) {
                await registration.unregister();
                console.log('Service Worker unregistered:', registration);
            }
            
            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('All caches cleared');
            }
            
            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Re-register service worker
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker re-registered:', registration);
            
            // Force reload the page
            window.location.reload(true);
        } else {
            // Fallback: just reload the page
            window.location.reload(true);
        }
    } catch (error) {
        console.error('Error updating app:', error);
        
        // Reset button state
        const updateBtn = document.querySelector('.update-app-btn');
        updateBtn.innerHTML = '<span class="btn-icon">🔄</span> Update App';
        updateBtn.disabled = false;
        
        showAlert('Update Failed', 'Failed to update the app. Please try refreshing the page manually.');
    }
}
