const AWS = require("aws-sdk");
require("dotenv").config();
const mime = require("mime-types"); // npm install mime-types

// Initialize S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,      // ✅ fixed
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // ✅ fixed
  region: process.env.AWS_REGION,
});

/**
 * Upload a file buffer to S3
 * @param {Buffer} fileBuffer - The file content
 * @param {string} fileName - File name with extension
 * @param {string} folder - S3 folder/key prefix
 * @returns {Promise<Object>} - Returns S3 upload response (includes Location)
 */
async function uploadToS3(fileBuffer, fileName, folder = "") {
  try {
    // Detect MIME type
    const contentType = mime.lookup(fileName) || "application/octet-stream";

    // Unique file key (prevent overwriting)
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/\s+/g, "_"); // no spaces
    const key = folder
      ? `${folder}/${timestamp}_${safeFileName}`
      : `${timestamp}_${safeFileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      //ACL: "public-read", // 👈 makes file accessible via URL
    };

    const uploadResult = await s3.upload(params).promise();
    console.log(`✅ File uploaded to S3: ${uploadResult.Location}`);
    return uploadResult;
  } catch (err) {
    console.error("❌ S3 upload failed:", err.message);
    throw err;
  }
}

module.exports = { uploadToS3 };
