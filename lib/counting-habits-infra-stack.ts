import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as iot from 'aws-cdk-lib/aws-iot';

interface CountingHabitsInfraStackProps extends cdk.StackProps {
  certArn: string,
  topicName: string
}

export class CountingHabitsInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CountingHabitsInfraStackProps) {
    super(scope, id, props);

    const thing = new iot.CfnThing(this, 'Thing', {
      thingName: 'counting-habits'
    });

    const thingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(this,  'AttachCertificateToThing', {
      principal: props.certArn,
      thingName: thing.thingName!
    });

    const iotPolicyDocument = this.createIotPolicyDocument(props.env!, props.topicName);

    const thingPolicy = new iot.CfnPolicy(this, 'ThingPolicy', {
      policyName:'counting-habits-iot-policy',
      policyDocument: iotPolicyDocument
    });

    const policyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(this, 'AttachCertificateToPolicy', {
      policyName: thingPolicy.policyName!,
      principal: props.certArn,
    });

    thingPrincipalAttachment.addDependency(thing);
    policyPrincipalAttachment.addDependency(thingPolicy);
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
