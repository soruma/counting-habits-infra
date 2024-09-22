#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CountingHabitsInfraStack } from '../lib/counting-habits-infra-stack';

const app = new cdk.App();
new CountingHabitsInfraStack(app, 'CountingHabitsInfraStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  certArn: app.node.tryGetContext('certArn'),
  topicName: app.node.tryGetContext('topicName')
});
