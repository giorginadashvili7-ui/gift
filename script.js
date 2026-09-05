import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
        import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyBBuaozhQWk5LoMlZ2owlK1NZIkSMgOUNc",
            authDomain: "trade-4d550.firebaseapp.com",
            projectId: "trade-4d550",
            storageBucket: "trade-4d550.firebasestorage.app",
            messagingSenderId: "121680295356",
            appId: "1:121680295356:web:2f72e2c739acd52731e7b9",
            measurementId: "G-5CNQ1GZ72S"
        };

        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        const auth = getAuth(app);
        const db = getFirestore(app);

        let allPosts = [];
        let targetDeleteId = null;
        let targetDeletePin = null;
        let selectedPostTypeForm = "offer";
        let selectedCategoryForm = "ტანსაცმელი";
        let selectedCityForm = "თბილისი";
        let selectedContactType = "phone";
        let homeSelectedCategory = "";
        let homeSelectedType = "all";

        signInAnonymously(auth).catch(console.error);

        // Toast Helper
        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            const bgClass = type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white';
            toast.className = `${bgClass} text-xs font-medium px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-2 transition-all transform translate-y-[-10px] opacity-0 pointer-events-auto`;
            toast.innerHTML = `
                <span>${message}</span>
                <span class="material-icons text-sm cursor-pointer opacity-70 hover:opacity-100" onclick="this.parentElement.remove()">close</span>
            `;
            document.getElementById('toast-container').appendChild(toast);
            setTimeout(() => {
                toast.classList.remove('translate-y-[-10px]', 'opacity-0');
            }, 10);
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        window.switchTab = function(tabId, element) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            
            // Sync Mobile Nav
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('text-brand-600');
                el.classList.add('text-slate-400');
            });

            // Sync Desktop Nav
            document.querySelectorAll('.desktop-nav-item').forEach(el => {
                el.classList.remove('text-brand-600', 'bg-brand-50');
                el.classList.add('text-slate-600');
            });
            
            document.getElementById(tabId).classList.remove('hidden');
            
            if(element) {
                if(element.classList.contains('nav-item')) {
                    element.classList.remove('text-slate-400');
                    element.classList.add('text-brand-600');
                } else if(element.classList.contains('desktop-nav-item') && !element.classList.contains('bg-brand-600')) {
                    element.classList.remove('text-slate-600');
                    element.classList.add('text-brand-600', 'bg-brand-50');
                }
            }

            if(tabId === 'tab-filter') {
                applyFilters();
            }
        };

        // Form Post Type Selector
        document.querySelectorAll('#form-type-selector .type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#form-type-selector .type-btn').forEach(b => {
                    b.classList.remove('border-brand-500', 'bg-brand-50', 'text-brand-700', 'active');
                    b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
                });
                this.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-600');
                this.classList.add('border-brand-500', 'bg-brand-50', 'text-brand-700', 'active');
                selectedPostTypeForm = this.getAttribute('data-val');

                const titleInput = document.getElementById('post-title');
                if (selectedPostTypeForm === 'request') {
                    titleInput.placeholder = "სათაური (მაგ. მჭირდება ბავშვის ეტლი) *";
                } else {
                    titleInput.placeholder = "სათაური (მაგ. გავაჩუქებ ქურთუკს) *";
                }
            });
        });

        // Form Category Selector
        document.querySelectorAll('#form-category-selector .cat-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#form-category-selector .cat-btn').forEach(b => {
                    b.classList.remove('border-brand-500', 'bg-brand-50', 'text-brand-700', 'active');
                    b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
                });
                this.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-600');
                this.classList.add('border-brand-500', 'bg-brand-50', 'text-brand-700', 'active');
                selectedCategoryForm = this.getAttribute('data-val');
            });
        });
                // Form City Selector
        const postCityOtherInput = document.getElementById('post-city-other');
        document.querySelectorAll('#form-city-selector .city-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#form-city-selector .city-btn').forEach(b => {
                    b.classList.remove('border-brand-500', 'bg-brand-50', 'text-brand-700', 'active');
                    b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
                });
                this.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-600');
                this.classList.add('border-brand-500', 'bg-brand-50', 'text-brand-700', 'active');
                
                selectedCityForm = this.getAttribute('data-val');
                if (selectedCityForm === 'სხვა') {
                    postCityOtherInput.classList.remove('hidden');
                    postCityOtherInput.setAttribute('required', 'required');
                } else {
                    postCityOtherInput.classList.add('hidden');
                    postCityOtherInput.removeAttribute('required');
                    postCityOtherInput.value = '';
                }
            });
        });

        // Contact Method Selector Handler
        document.querySelectorAll('#contact-type-selector .contact-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#contact-type-selector .contact-btn').forEach(b => {
                    b.classList.remove('border-brand-500', 'bg-brand-50', 'text-brand-600', 'active');
                    b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-500');
                });
                this.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-500');
                this.classList.add('border-brand-500', 'bg-brand-50', 'text-brand-600', 'active');
                
                selectedContactType = this.getAttribute('data-type');
                const contactInput = document.getElementById('post-contact');
                
                if (selectedContactType === 'phone') {
                    contactInput.placeholder = "ტელეფონის ნომერი";
                } else if (selectedContactType === 'whatsapp') {
                    contactInput.placeholder = "WhatsApp ნომერი";
                } else if (selectedContactType === 'facebook') {
                    contactInput.placeholder = "FB პროფილი / ბმული";
                } else if (selectedContactType === 'instagram') {
                    contactInput.placeholder = "IG მომხმარებელი (@user)";
                }
            });
        });

        // Home Post Type Filter Switcher (All / Offer / Request)
        document.querySelectorAll('#post-type-toggle .type-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('#post-type-toggle .type-tab').forEach(t => {
                    t.classList.remove('bg-white', 'text-slate-800', 'shadow-xs', 'active', 'font-bold');
                    t.classList.add('text-slate-600', 'font-semibold');
                });
                this.classList.remove('text-slate-600', 'font-semibold');
                this.classList.add('bg-white', 'text-slate-800', 'shadow-xs', 'active', 'font-bold');
                
                homeSelectedType = this.getAttribute('data-type');
                filterAndRenderHomePosts();
            });
        });

        // Home Page Category Chips Filter
        document.querySelectorAll('#home-category-chips .chip').forEach(chip => {
            chip.addEventListener('click', function() {
                document.querySelectorAll('#home-category-chips .chip').forEach(c => {
                    c.classList.remove('bg-brand-600', 'text-white', 'shadow-xs');
                    c.classList.add('bg-white', 'border', 'border-slate-200', 'text-slate-600');
                });
                this.classList.remove('bg-white', 'border', 'border-slate-200', 'text-slate-600');
                this.classList.add('bg-brand-600', 'text-white', 'shadow-xs');
                homeSelectedCategory = this.getAttribute('data-cat');
                
                filterAndRenderHomePosts();
            });
        });

        function filterAndRenderHomePosts() {
            const filteredHome = allPosts.filter(p => {
                const postType = p.type || 'offer';
                const matchesType = homeSelectedType === 'all' || postType === homeSelectedType;
                const matchesCat = homeSelectedCategory === "" || p.category === homeSelectedCategory;
                return matchesType && matchesCat;
            });
            renderPosts(filteredHome, 'posts-container');
        }

        // Realtime Listener with limit(50)
        function listenToPosts() {
            const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
            onSnapshot(q, (snapshot) => {
                allPosts = [];
                snapshot.forEach((docSnap) => {
                    allPosts.push({ id: docSnap.id, ...docSnap.data() });
                });
                
                document.getElementById('home-posts-count').innerText = `${allPosts.length} განცხადება`;
                filterAndRenderHomePosts();
            }, (error) => {
                console.error("Error listening to posts: ", error);
                document.getElementById('posts-container').innerHTML = '<div class="text-center text-slate-400 py-12 text-sm col-span-full">შეცდომა მონაცემების ჩატვირთვისას</div>';
            });
        }
        function getCategoryEmoji(cat) {
            switch(cat) {
                case 'ტანსაცმელი': return '👕';
                case 'მედიკამენტები': return '💊';
                case 'საბავშვო': return '🧸';
                case 'ტექნიკა': return '💻';
                case 'საოჯახო': return '🏡';
                default: return '📦';
            }
        }

        function getTypeBadge(type) {
            if (type === 'request') {
                return `<span class="bg-amber-100 text-amber-800 border border-amber-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                    <span>🙏</span>
                    <span>ვიჩუქებ</span>
                </span>`;
            }
            return `<span class="bg-brand-50 text-brand-700 border border-brand-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                <span>🎁</span>
                <span>გავაჩუქებ</span>
            </span>`;
        }

        function getContactBadge(type, value) {
            const escapedValue = escapeHtml(value);
            if (type === 'whatsapp') {
                const cleanPhone = value.replace(/[^0-9]/g, '');
                return `<a href="https://wa.me/${cleanPhone}" target="_blank" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors"><i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp</a>`;
            } else if (type === 'facebook') {
                return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium"><i class="fa-brands fa-facebook text-sm"></i> ${escapedValue}</span>`;
            } else if (type === 'instagram') {
                return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 font-medium"><i class="fa-brands fa-instagram text-sm"></i> ${escapedValue}</span>`;
            } else {
                return `<a href="tel:${escapedValue}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"><i class="fa-solid fa-phone text-xs"></i> ${escapedValue}</a>`;
            }
        }

        function renderPosts(posts, containerId) {
            const container = document.getElementById(containerId);
            if (posts.length === 0) {
                container.innerHTML = '<div class="text-center text-slate-400 py-12 text-sm col-span-full flex flex-col items-center gap-1"><span class="material-icons text-3xl text-slate-300">inbox</span><span>განცხადებები არ მოიძებნა</span></div>';
                return;
            }

            container.innerHTML = posts.map(post => `
                <div class="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div class="space-y-2">
                        <div class="flex justify-between items-start gap-2">
                            <h3 class="font-semibold text-slate-900 text-sm sm:text-base leading-snug">${escapeHtml(post.title)}</h3>
                            <div class="flex items-center gap-1.5 flex-wrap justify-end">
                                ${getTypeBadge(post.type || 'offer')}
                                <span class="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                                    <span>${getCategoryEmoji(post.category)}</span>
                                    <span>${escapeHtml(post.category)}</span>
                                </span>
                            </div>
                        </div>
                        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">${escapeHtml(post.description)}</p>
                    </div>
                    
                    <div class="space-y-2 pt-3 mt-2 border-t border-dashed border-slate-100">
                        <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <div class="flex items-center gap-1 text-slate-400 font-medium">
                                <span class="material-icons text-sm">location_on</span>
                                <span>${escapeHtml(post.city)}</span>
                            </div>
                            <div>
                                ${getContactBadge(post.contactType || 'phone', post.contact)}
                            </div>
                        </div>
                        <div class="flex justify-end pt-0.5">
                            <button onclick="openDeleteModal('${post.id}', '${post.pin}')" class="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600 font-medium transition-colors">
                                <span class="material-icons text-sm">delete_outline</span>
                                წაშლა
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function escapeHtml(text) {
            if(!text) return '';
            return text.replace(/[&<>"']/g, function(m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
            });
        }

        // Handle Add Post Submit
        document.getElementById('add-post-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submit-post-btn');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70');

            const title = document.getElementById('post-title').value;
            const description = document.getElementById('post-desc').value;
            
            let city = selectedCityForm;
            if (city === 'სხვა') {
                city = postCityOtherInput.value.trim();
            }

            const contact = document.getElementById('post-contact').value;
            const pin = document.getElementById('post-pin').value;

            try {
                await addDoc(collection(db, "posts"), {
                    title,
                    description,
                    type: selectedPostTypeForm,
                    category: selectedCategoryForm,
                    city,
                    contactType: selectedContactType,
                    contact,
                    pin,
                    createdAt: serverTimestamp()
                });

                document.getElementById('add-post-form').reset();
                postCityOtherInput.classList.add('hidden');
                
                showToast("განცხადება წარმატებით დაემატა!");
                switchTab('tab-home', document.querySelector('.nav-home-btn'));
            } catch (e) {
                showToast("შეცდომა პოსტის დამატებისას: " + e.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70');
            }
        });

        window.openDeleteModal = function(id, pin) {
            targetDeleteId = id;
            targetDeletePin = pin;
            document.getElementById('delete-pin-input').value = '';
            
            const modal = document.getElementById('delete-modal');
            const box = document.getElementById('delete-modal-box');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                box.classList.remove('scale-95');
                box.classList.add('scale-100');
            }, 10);
        };

        window.closeDeleteModal = function() {
            const modal = document.getElementById('delete-modal');
            const box = document.getElementById('delete-modal-box');
            modal.classList.add('opacity-0');
            box.classList.remove('scale-100');
            box.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                targetDeleteId = null;
                targetDeletePin = null;
            }, 200);
        };

        document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
            const inputPin = document.getElementById('delete-pin-input').value;
            if (inputPin === targetDeletePin) {
                try {
                    await deleteDoc(doc(db, "posts", targetDeleteId));
                    closeDeleteModal();
                    showToast("პოსტი წარმატებით წაიშალა");
                } catch (e) {
                    showToast("შეცდომა წაშლისას: " + e.message, 'error');
                }
            } else {
                showToast("არასწორი PIN კოდი!", 'error');
            }
        });

        let selectedCategory = "";

        const filterCitySelect = document.getElementById('filter-city');
        const filterCityOtherInput = document.getElementById('filter-city-other');
        const filterKeywordInput = document.getElementById('filter-keyword');
        const filterTypeSelect = document.getElementById('filter-type');

        // Text Search & Type Listener
        filterKeywordInput.addEventListener('input', applyFilters);
        filterTypeSelect.addEventListener('change', applyFilters);

        filterCitySelect.addEventListener('change', function() {
            if (this.value === 'სხვა') {
                filterCityOtherInput.classList.remove('hidden');
            } else {
                filterCityOtherInput.classList.add('hidden');
                filterCityOtherInput.value = '';
            }
            applyFilters();
        });

        filterCityOtherInput.addEventListener('input', applyFilters);

        document.querySelectorAll('#filter-category-chips .chip').forEach(chip => {
            chip.addEventListener('click', function() {
                document.querySelectorAll('#filter-category-chips .chip').forEach(c => {
                    c.classList.remove('bg-brand-600', 'text-white', 'shadow-xs');
                    c.classList.add('bg-slate-100', 'text-slate-600');
                });
                this.classList.remove('bg-slate-100', 'text-slate-600');
                this.classList.add('bg-brand-600', 'text-white', 'shadow-xs');
                selectedCategory = this.getAttribute('data-cat');
                applyFilters();
            });
        });

        function applyFilters() {
            let selectedCity = filterCitySelect.value;
            const selectedFilterType = filterTypeSelect.value;
            const customFilterCity = filterCityOtherInput.value.trim().toLowerCase();
            const keyword = filterKeywordInput.value.trim().toLowerCase();

            const filtered = allPosts.filter(post => {
                // Post Type Filter Logic
                const postType = post.type || 'offer';
                const matchesType = selectedFilterType === "" || postType === selectedFilterType;

                // City Filter Logic
                let matchesCity = false;
                if (selectedCity === "") {
                    matchesCity = true;
                } else if (selectedCity === "სხვა") {
                    if (customFilterCity !== "") {
                        matchesCity = post.city && post.city.toLowerCase().includes(customFilterCity);
                    } else {
                        const standardCities = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "ფოთი", "ხაშური", "სამტრედია"];
                        matchesCity = !standardCities.includes(post.city);
                    }
                } else {
                    matchesCity = post.city === selectedCity;
                }

                // Category Filter Logic
                const matchesCat = selectedCategory === "" || post.category === selectedCategory;

                // Keyword Search Filter Logic
                let matchesKeyword = true;
                if (keyword !== "") {
                    const titleMatch = post.title && post.title.toLowerCase().includes(keyword);
                    const descMatch = post.description && post.description.toLowerCase().includes(keyword);
                    const cityMatch = post.city && post.city.toLowerCase().includes(keyword);
                    const contactMatch = post.contact && post.contact.toLowerCase().includes(keyword);

                    matchesKeyword = titleMatch || descMatch || cityMatch || contactMatch;
                }

                return matchesType && matchesCity && matchesCat && matchesKeyword;
            });

            renderPosts(filtered, 'filtered-posts-container');
        }

        listenToPosts();