const { google } = require('googleapis');
const parser = require('aws-lambda-multipart-parser');
const stream = require('stream');

exports.handler = async (event) => {
  // 1. AUTHENTICATE WITH GOOGLE
  // Credentials and Folder ID will be stored in Netlify Environment Variables
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
  const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // 2. PARSE THE FORM DATA
    // The event body from Netlify is base64 encoded when it's a multipart form
    const form = await parser.parse(event);
    
    // You can access other form fields like this:
    // const teacherName = form.teacher_name;
    
    const fileUploadPromises = form.files.map(async (file) => {
      if (!file.filename) return; // Skip if no file was uploaded for a field

      // 3. UPLOAD EACH FILE TO GOOGLE DRIVE
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.content);

      const { data } = await drive.files.create({
        media: {
          mimeType: file.contentType,
          body: bufferStream,
        },
        requestBody: {
          name: `${Date.now()}_${file.filename}`, // Add timestamp to avoid name conflicts
          parents: [FOLDER_ID],
        },
        fields: 'id',
      });

      console.log(`Uploaded file: ${file.filename} with ID: ${data.id}`);
      return data.id;
    });

    await Promise.all(fileUploadPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Files uploaded successfully!' }),
    };

  } catch (error) {
    console.error('Upload Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error uploading files.', error: error.message }),
    };
  }
};
