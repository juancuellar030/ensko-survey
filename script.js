document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('entry-form');
    const status = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        status.textContent = '';
        
        const formData = new FormData(this);

        // --- NEW DEBUGGING STEP ---
        // The following lines will print all the data in the form to the console.
        console.log("--- Sending Form Data ---");
        for (let [key, value] of formData.entries()) {
            // For files, we just show the name, not the content.
            if (value instanceof File) {
                console.log(`${key}: ${value.name}`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }
        console.log("-------------------------");
        // --- END OF DEBUGGING STEP ---

        try {
            const response = await fetch('/.netlify/functions/upload-to-drive', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                status.textContent = 'Form submitted successfully!';
                status.style.color = 'green';
                form.reset();
            } else {
                // Now we get more detail from the server on failure
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Server responded with an error.');
            }

        } catch (error) {
            console.error('Submission Error:', error);
            status.textContent = `An error occurred: ${error.message}`;
            status.style.color = 'red';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    });
});

function openCategory(evt, categoryName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(categoryName).style.display = "block";
    evt.currentTarget.className += " active";
}
