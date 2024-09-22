#!/bin/bash

thing_name=counting-habits
certificate_arns=$(aws iot list-thing-principals --thing-name ${thing_name} | jq -r '.principals[]')

for certificate_arn in $certificate_arns
do
    certificate_id=$(echo $certificate_arn | sed -e 's/.*cert\///')
    policy_name=$(aws iot list-attached-policies --target $certificate_arn | jq -r '.policies[].policyName')

    aws iot detach-thing-principal --thing-name ${thing_name} --principal ${certificate_arn}
    aws iot update-certificate --new-status INACTIVE --certificate-id ${certificate_id}
    aws iot detach-policy --policy-name ${policy_name} --target ${certificate_arn}
    aws iot delete-certificate --certificate-id ${certificate_id}
done
