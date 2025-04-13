document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const passwordInput = document.getElementById("password");
    const passwordMessage = document.getElementById("passwordMessage");
    const passwordStrengthBar = document.getElementById("passwordStrengthBar");

    function evaluatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[\W_]/.test(password)) strength++;
        return strength;
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", function () {
            const password = passwordInput.value;
            const strength = evaluatePasswordStrength(password);

            let message = "";
            let color = "";
            let width = "0%";

            switch (strength) {
                case 1:
                case 2:
                    message = "❌ Weak password";
                    color = "red";
                    width = "30%";
                    break;
                case 3:
                case 4:
                    message = "⚠️ Moderate password";
                    color = "orange";
                    width = "70%";
                    break;
                case 5:
                    message = "✅ Strong password";
                    color = "green";
                    width = "100%";
                    break;
                default:
                    message = "";
                    break;
            }

            passwordMessage.textContent = message;
            passwordMessage.style.color = color;
            passwordStrengthBar.style.width = width;
            passwordStrengthBar.style.backgroundColor = color;
        });
    }

    if (form) {
        form.addEventListener("submit", function (event) {
            const password = passwordInput.value;
            const strength = evaluatePasswordStrength(password);

            if (strength < 3) {
                event.preventDefault();
                alert("Please choose a stronger password.");
                passwordInput.focus();
            } else {
                alert("Your password was successfully added!");
            }
        });
    }

    document.querySelectorAll(".nav-link, a[href^='#']").forEach(anchor => {
        anchor.addEventListener("click", function (event) {
            event.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                history.pushState(null, null, `#${targetId}`);
            } else {
                console.error("Target section not found:", targetId);
            }

            const navbarCollapse = document.querySelector(".navbar-collapse");
            if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                new bootstrap.Collapse(navbarCollapse).hide();
            }
        });
    });

    const getStartedBtn = document.getElementById("getStartedBtn");
    const loginSection = document.getElementById("login");

    if (getStartedBtn && loginSection) {
        getStartedBtn.addEventListener("click", function (event) {
            event.preventDefault();
            loginSection.scrollIntoView({ behavior: "smooth" });
        });
    }
});
