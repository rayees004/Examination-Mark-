const GOOGLE_FORM_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSd-1teUbeN-90GUxgzNFRNm2FL8ScK9UJGVSrUHOqRG4WOx3g/formResponse';

// Field IDs from the form
const ENTRY_IDS = {
    SUBJECT: 'entry.1558986237',
    TERM: 'entry.256953670',
    NAME: 'entry.1086168159',
    MARK: 'entry.895193547'
};

function generateForm() {
    const subjectSelect = document.getElementById('subjectSelect');
    const studentCountInput = document.getElementById('studentCount');
    const container = document.getElementById('studentRows');
    const formSection = document.getElementById('formContainer');
    const subjectDisplay = document.getElementById('selectedSubjectDisplay');

    const subject = subjectSelect.value;
    const count = parseInt(studentCountInput.value);

    // Validation
    if (!subject) {
        alert("Please select a Subject first.");
        return;
    }
    if (!count || count < 1) {
        alert("Please enter at least 1 student.");
        return;
    }

    // Update UI
    subjectDisplay.textContent = `Entering data for Subject: ${subject}`;
    container.innerHTML = ''; // Clear previous rows

    // Generate Rows
    for (let i = 0; i < count; i++) {
        const row = document.createElement('div');
        row.className = 'student-row';
        row.innerHTML = `
            <div class="col-slno">
                ${i + 1}
            </div>
            <div class="col-term">
                <select name="term_${i}" required>
                    <option value="" disabled selected>Select Term</option>
                    <option value="1st term">1st term</option>
                    <option value="2nd term">2nd term</option>
                    <option value="3rd term">3rd term</option>
                </select>
            </div>
            <div class="col-name">
                <input type="text" name="name_${i}" placeholder="Student Name" required>
            </div>
            <div class="col-mark">
                <input type="text" name="mark_${i}" placeholder="Mark" required>
            </div>
        `;
        container.appendChild(row);
    }

    formSection.style.display = 'block';

    // Scroll to form
    formSection.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('statusMessage').textContent = '';
    document.getElementById('statusMessage').className = '';
}

async function submitAll() {
    const rows = document.getElementsByClassName('student-row');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('statusMessage');
    const subject = document.getElementById('subjectSelect').value;

    // --- Step 1: Pre-Validation Loop ---
    // We want to make sure ALL rows are filled BEFORE we start submitting anything.
    let isValid = true;
    let firstErrorRow = null;

    // Reset previous error styles
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        r.classList.remove('row-error');
        const inputs = r.querySelectorAll('input, select');
        for (let j = 0; j < inputs.length; j++) {
            inputs[j].style.borderColor = '#e2e8f0';
        }
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const term = row.querySelector(`select`).value;
        const name = row.querySelector(`input[name^="name"]`).value.trim();
        const mark = row.querySelector(`input[name^="mark"]`).value.trim();

        if (!term || !name || !mark) {
            isValid = false;
            // Highlight the specific row with missing data
            row.classList.add('row-error');

            // Highlight empty fields specifically
            if (!term) row.querySelector('select').style.borderColor = '#fc8181';
            if (!name) row.querySelector('input[name^="name"]').style.borderColor = '#fc8181';
            if (!mark) row.querySelector('input[name^="mark"]').style.borderColor = '#fc8181';

            if (!firstErrorRow) firstErrorRow = row;
        }
    }

    if (!isValid) {
        statusDiv.textContent = '❌ Please fill in all fields for every student before submitting.';
        statusDiv.className = 'error';
        if (firstErrorRow) firstErrorRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return; // Stop here, do not submit anything
    }

    // --- Step 2: Submission Loop ---
    // If we reach here, all data is valid.

    let successCount = 0;
    let failCount = 0;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    statusDiv.className = '';

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const term = row.querySelector(`select`).value;
        const name = row.querySelector(`input[name^="name"]`).value;
        const mark = row.querySelector(`input[name^="mark"]`).value;

        const formData = new FormData();
        formData.append(ENTRY_IDS.SUBJECT, subject);
        formData.append(ENTRY_IDS.TERM, term);
        formData.append(ENTRY_IDS.NAME, name);
        formData.append(ENTRY_IDS.MARK, mark);

        try {
            statusDiv.textContent = `⏳ Submitting ${i + 1} of ${rows.length}...`;
            statusDiv.className = 'progress';

            await fetch(GOOGLE_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });
            successCount++;
        } catch (error) {
            console.error(error);
            failCount++;
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit All Data';

    if (failCount === 0) {
        statusDiv.textContent = `✅ Success! All ${successCount} entries sent for ${subject}.`;
        statusDiv.className = 'progress'; // using progress colour for success
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';
    } else {
        statusDiv.textContent = `⚠️ Done, but some failed. Submitted: ${successCount}, Failed: ${failCount}`;
        statusDiv.className = 'error';
    }
}
