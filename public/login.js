document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const alertBox = document.getElementById('alert-box');
    const resendVerificationLink = document.getElementById('resend-verification');
    const resendVerificationModal = document.getElementById('resend-verification-modal');
    const closeResendModal = document.getElementById('close-resend-modal');
    const sendVerificationLinkButton = document.getElementById('send-verification-link');
    const verificationAlertBox = document.getElementById('verification-alert-box');
    const verificationSpinner = document.getElementById('verification-spinner');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const loginData = {
            usernameEmail: formData.get('usernameEmail'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();
            alertBox.textContent = result.message;
            alertBox.className = `custom-alert alert-${response.ok ? 'success' : 'danger'}`;
            alertBox.style.display = 'block';

            if (result.isVerified === false) {
                resendVerificationLink.style.display = 'block';
            }

            if (response.ok) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('username', result.username);
                window.location.href = '/';
            }
        } catch {
            alertBox.textContent = 'An error occurred. Please try again.';
            alertBox.className = 'custom-alert alert-danger';
            alertBox.style.display = 'block';
        }
    });

    resendVerificationLink.addEventListener('click', () => {
        resendVerificationModal.style.display = 'block';
    });

    closeResendModal.addEventListener('click', () => {
        resendVerificationModal.style.display = 'none';
    });

    sendVerificationLinkButton.addEventListener('click', async () => {
        const email = document.getElementById('verification-email').value;
        if (email) {
            verificationSpinner.style.display = 'block';
            sendVerificationLinkButton.disabled = true;
            try {
                const response = await fetch('/api/auth/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const result = await response.json();
                verificationAlertBox.textContent = result.message;
                verificationAlertBox.className = `custom-alert alert-${response.ok ? 'success' : 'danger'}`;
                verificationAlertBox.style.display = 'block';
                sendVerificationLinkButton.disabled = false;
                verificationSpinner.style.display = 'none';
                setTimeout(() => {
                    resendVerificationModal.style.display = 'none';
                    verificationAlertBox.style.display = 'none';
                }, 3000);
            } catch (error) {
                verificationAlertBox.textContent = 'Error sending verification link. Please try again.';
                verificationAlertBox.className = 'custom-alert alert-danger';
                verificationAlertBox.style.display = 'block';
                sendVerificationLinkButton.disabled = false;
                verificationSpinner.style.display = 'none';
            }
        }
    });

    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == resendVerificationModal) {
            resendVerificationModal.style.display = "none";
        }
    }
});
