const { google } = require('googleapis');
const parser = require('aws-lambda-multipart-parser');
const stream = require('stream');

exports.handler = async (event) => {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const form = await parser.parse(event);
        const uploadedFileDetails = {};

        if (Array.isArray(form.files) && form.files.length > 0) {
            console.log(`Received ${form.files.length} file(s) for processing.`);
            const fileUploadPromises = form.files.map(async (file) => {
                if (!file.filename) return;

                const bufferStream = new stream.PassThrough();
                bufferStream.end(file.content);

                const { data } = await drive.files.create({
                    media: { mimeType: file.contentType, body: bufferStream },
                    requestBody: { name: `${Date.now()}_${file.fieldname}_${file.filename}`, parents: [FOLDER_ID] },
                    fields: 'id, name',
                });
                
                uploadedFileDetails[file.fieldname] = data.id;
                console.log(`Successfully uploaded file: ${data.name} with ID: ${data.id}`);
            });
            await Promise.all(fileUploadPromises);
        } else {
            console.log("No files were included in this submission.");
        }
        
        // This newRow definition is more robust and directly accesses form fields.
        const newRow = [
            new Date().toISOString(),
            form.school || '', form.teacher_name || '', form.email || '',
            form.catA_student1_name || '', form.catA_student1_grade || '', uploadedFileDetails.catA_student1_id || 'N/A',
            form.catA_student2_name || '', form.catA_student2_grade || '', uploadedFileDetails.catA_student2_id || 'N/A',
            form.catB_student1_name || '', form.catB_student1_grade || '', uploadedFileDetails.catB_student1_id || 'N/A',
            form.catB_student2_name || '', form.catB_student2_grade || '', uploadedFileDetails.catB_student2_id || 'N/A',
            form.catC_student1_name || '', form.catC_student1_grade || '', uploadedFileDetails.catC_student1_id || 'N/A',
            form.catC_student2_name || '', form.catC_student2_grade || '', uploadedFileDetails.catC_student2_id || 'N/A',
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1', // Ensure this is the EXACT name of your sheet tab
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newRow] },
        });

        console.log("Successfully appended data to Google Sheet.");

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Form submitted and data recorded successfully!' }),
        };

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error processing form.', error: error.message }),
        };
    }
};
