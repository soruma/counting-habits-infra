import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface CountingHabitsInfraStackProps extends cdk.StackProps {
  certArn: string,
  topicName: string,
  s3BucketName: string
}

export class CountingHabitsInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CountingHabitsInfraStackProps) {
    super(scope, id, props);

    this.createThing(props.env!, props.topicName, props.certArn);

    const bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.s3BucketName
    });

    const bucketRole = new iam.Role(this, 'BucketRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com')
    });
    bucketRole.addToPolicy(new iam.PolicyStatement({
      actions: [ 's3:PutObject' ],
      resources: [ bucket.bucketArn + '/*' ]
    }));

    new iot.CfnTopicRule(this, 'TopicRule', {
      ruleName: 'CountingHabitsToS3',
      topicRulePayload: {
        actions: [{
          s3: {
            bucketName: bucket.bucketName,
            roleArn: bucketRole.roleArn,
            key: '${topic()}/${timestamp()}'
          }
        }],
        sql: `SELECT * FROM '${props.topicName}'`
      }
    });
  }

  createThing = (env: cdk.Environment, topicName: string, certArn: string): iot.CfnThing => {
    const thing = new iot.CfnThing(this, 'Thing', {
      thingName: 'counting-habits'
    });

    const thingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(this,  'AttachCertificateToThing', {
      principal: certArn,
      thingName: thing.thingName!
    });

    const iotPolicyDocument = this.createIotPolicyDocument(env, topicName);

    const thingPolicy = new iot.CfnPolicy(this, 'ThingPolicy', {
      policyName:'counting-habits-iot-policy',
      policyDocument: iotPolicyDocument
    });

    const policyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(this, 'AttachCertificateToPolicy', {
      policyName: thingPolicy.policyName!,
      principal: certArn,
    });

    thingPrincipalAttachment.addDependency(thing);
    policyPrincipalAttachment.addDependency(thingPolicy);

    return thing;
  }

  createIotPolicyDocument = (env: cdk.Environment, topicName: string): iam.PolicyDocument => {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'iot:Connect'
          ],
          resources: [
            `arn:aws:iot:${env.region}:${env.account}:client/*`
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'iot:Publish',
            'iot:Receive'
          ],
          resources: [
            `arn:aws:iot:${env.region!}:${env.account!}:topic/${topicName}`
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'iot:Subscribe',
          ],
          resources: [
            `arn:aws:iot:${env.region!}:${env.account!}:topic/${topicName}`
          ]
        })
      ]
    });
  }
}
