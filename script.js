document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('entry-form');
    const status = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        status.textContent = '';
        
        // This gathers all form data, including files
        const formData = new FormData(this);

        try {
            // IMPORTANT: Replace this URL with your actual backend endpoint
            const response = await fetch('YOUR_BACKEND_ENDPOINT_HERE', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                status.textContent = 'Form submitted successfully!';
                status.style.color = 'green';
                form.reset(); // Clear the form
            } else {
                throw new Error('Submission failed. Server responded with an error.');
            }

        } catch (error) {
            console.error('Submission Error:', error);
            status.textContent = 'An error occurred. Please try again.';
            status.style.color = 'red';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    });
});

function openCategory(evt, categoryName) {
    let i, tabcontent, tablinks;

    // Hide all tab content
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Deactivate all tab links
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the selected tab and activate its button
    document.getElementById(categoryName).style.display = "block";
    evt.currentTarget.className += " active";
}
