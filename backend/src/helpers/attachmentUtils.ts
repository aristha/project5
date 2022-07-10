import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const S3 = new XAWS.S3({
    signatureVersion: 'v4'
})
const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION;
// TODO: Implement the fileStogare logic
export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<string> {
    return S3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: userId + todoId,
        Expires: urlExpiration
    })
}