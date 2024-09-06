document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form from submitting the traditional way

    const formData = {
        firstName: document.querySelector('input[name="firstName"]').value,
        lastName: document.querySelector('input[name="lastName"]').value,
        dob: document.querySelector('input[name="dob"]').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        email: document.querySelector('input[name="email"]').value,
        password: document.querySelector('input[name="password"]').value,
        passwordRepeat: document.querySelector('input[name="passwordRepeat"]').value
    };

    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            alert('Sign Up Successful!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
