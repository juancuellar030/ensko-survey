const { google } = require('googleapis');
const parser = require('aws-lambda-multipart-parser');
const stream = require('stream');

exports.handler = async (event) => {
    // --- 1. GET ENVIRONMENT VARIABLES ---
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // --- 2. AUTHENTICATE WITH GOOGLE ---
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    });

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // --- 3. PARSE THE FORM DATA ---
        const form = await parser.parse(event);
        const uploadedFileDetails = {};

        // --- 4. UPLOAD FILES TO DRIVE (WITH SAFETY CHECK) ---
        // Check if form.files exists and is an array before mapping
        if (Array.isArray(form.files)) {
            const fileUploadPromises = form.files.map(async (file) => {
                if (!file.filename) return;

                const bufferStream = new stream.PassThrough();
                bufferStream.end(file.content);

                const { data } = await drive.files.create({
                    media: { mimeType: file.contentType, body: bufferStream },
                    requestBody: { name: `${Date.now()}_${file.filename}`, parents: [FOLDER_ID] },
                    fields: 'id, name',
                });
                
                uploadedFileDetails[file.fieldname] = data.id;
                console.log(`Uploaded file: ${data.name} with ID: ${data.id}`);
            });
            
            await Promise.all(fileUploadPromises);
        } else {
            console.log("No files were uploaded with this submission.");
        }

        // --- 5. APPEND TEXT DATA TO GOOGLE SHEET ---
        const { school, teacher_name, email, ...students } = form;
        
       const newRow = [
            new Date().toISOString(),
            form.school || '',
            form.teacher_name || '',
            form.email || '',
            form.catA_student1_name || '',
            form.catA_student1_grade || '',
            uploadedFileDetails.catA_student1_id || 'N/A',
            form.catA_student2_name || '',
            form.catA_student2_grade || '',
            uploadedFileDetails.catA_student2_id || 'N/A',
            form.catB_student1_name || '',
            form.catB_student1_grade || '',
            uploadedFileDetails.catB_student1_id || 'N/A',
            form.catB_student2_name || '',
            form.catB_student2_grade || '',
            uploadedFileDetails.catB_student2_id || 'N/A',
            form.catC_student1_name || '',
            form.catC_student1_grade || '',
            uploadedFileDetails.catC_student1_id || 'N/A',
            form.catC_student2_name || '',
            form.catC_student2_grade || '',
            uploadedFileDetails.catC_student2_id || 'N/A',
        ];

       await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            // --- THIS IS THE FIX ---
            // We just specify the sheet name, and 'append' will find the first empty row.
            range: 'Sheet1', 
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newRow] },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Form submitted and data recorded successfully!' }),
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error processing form.', error: error.message }),
        };
    }
};
