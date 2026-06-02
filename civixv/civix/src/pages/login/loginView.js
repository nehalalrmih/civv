/**
 * طبقة العرض لصفحة تسجيل الدخول (Login UI View)
 */
export const loginView = {
    render: () => `
        <div class="container">
            <section class="left_side">
                <article class="login_form">
                    <form id="loginForm">
                        <div class="username"> 
                            <div class="label"><label for="username">اسم المستخدم</label></div>
                            <input type="text" id="username" name="username" required placeholder="أدخل اسم المستخدم">
                            <span class="icon"><i class="fa-solid fa-circle-user"></i></span>
                        </div>

                        <div class="password">
                            <div class="label"><label for="password">كلمة المرور</label></div>
                            <input type="password" id="password" name="password" required placeholder="أدخل كلمة المرور">
                            <span class="icon"><i class="fa-solid fa-lock"></i></span>
                        </div>
                        
                        <button type="submit" class="btn_log" id="login_btn">تسجيل الدخول</button>
                    </form>
                    <div id="message" aria-live="polite"></div>
                </article>

                <footer class="HUIZ_login">
                    <h4>نحو إدارة ذكية لكل مشروع وإجراء</h4>
                </footer>
            </section>

            <aside class="right_side">
                 <img class="img_right" src="./public/images/loginlogo.png" alt="شعار النظام">
                 <div class="textlogin">
                    <p>جهاز تنفيذ مشروعات الإسكان والمرافق - مكتب الزاوية</p>
                    <p>Housing & Infrastructure Board - Al-Zawiya</p>
                </div>
            </aside>
        </div>
    `,
    getElements: () => ({
        form: document.getElementById("loginForm"),
        message: document.getElementById("message"),
        submitBtn: document.getElementById('login_btn'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
    }),
    setLoading: (elements) => {
        elements.submitBtn.disabled = true;
        elements.message.textContent = '...جاري التحقق من البيانات';
        elements.message.style.color = 'yellow';
    },
    setFeedback: (elements, msg, color, isBtnEnabled = false) => {
        elements.message.textContent = msg;
        elements.message.style.color = color;
        elements.submitBtn.disabled = !isBtnEnabled;
    }
};
