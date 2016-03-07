# autosnap

## Description
Once configured, this function will crawl through your entire AWS account, and take snapshots of each EBS volume attached to every instance within your account, across all regions. If you set up a new server today, it will be included in this process the next time this function runs. The snapshots created by this tool will include a detailed description with the instance name tag, mount point, and instance id.

## Configuration
1. Create a new role in IAM. This new role will need to be a "Service Role" for "Amazon EC2". It will need to include the "AmazonEC2FullAccess" and "CloudWatchLogsFullAccess" policies. I realize that you could create custom and more restrictive policies for this role and encourage you to do separate research on further restricting this role. However, the previously mentioned policies will get you up and running.
2. Create a new lambda function and select Python 2.7 as the runtime. Select the new role you just created. The default Hander is correct.
3. Paste the source code of the "lambda_function.py" file into the source code input or upload a zip of this file.
4. Change the "Timeout" to 5 minutes.
5. Once you have created your function, run a test and verify that you can see the snapshots within EC2.

## Scheduling
1. Within your lambda function in the AWS console, select the "Event sources" tab.
2. Click "Add event source"
3. Select "CloudWatch Events - Schedule"
4. Give the rule a name
5. Inside of "Schedule expression", select a default Schedule or specify a cron() style expression. For example, the expression cron(15 09 * * ? *) will make the function execute at 9:15 am every day. Keep in mind that the timezone of the cron execution is UTC-based.
6. Submit the changes and your function is now scheduled.
