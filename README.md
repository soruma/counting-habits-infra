# counting-habits-infra

## Deploy manual

### Create certificate

```
aws iot create-keys-and-certificate \
    --set-as-active \
    --certificate-pem-outfile counting-habits-certificate.crt.pem \
    --public-key-outfile counting-habits-public.key \
    --private-key-outfile counting-habits-private.key
```

Used when deploying `certificateArn`.

### Deploy

```
pnpm dlx cdk deploy \
    --context certArn=${certificateArn} \
    --context topicName=${topicName} \
    --context s3BucketName=${s3BucketName}
```

## Destroy manual

### Remove certificat

```
delete_counting_habits_certificate.sh
```

### Destroy

```
pnpm dlx cdk destroy
```
