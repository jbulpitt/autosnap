import boto3
import datetime

ec2 = boto3.client('ec2')
datestamp = datetime.date.today().strftime('%Y%m%d')

def lambda_handler(event, context):
    regions = ec2.describe_regions()

    for region in regions['Regions']:
        print "Process starting for region: [%s]" % (
            region['RegionName'])

        region_active = region['RegionName']
        ec = boto3.client('ec2', region_name=region_active)

        reservations = ec.describe_instances().get(
         'Reservations', []
        )

        instances = sum(
         [
             [i for i in r['Instances']]
             for r in reservations
         ], [])

        print "Found %d instances that need backing up" % len(instances)

        for instance in instances:
         for dev in instance['BlockDeviceMappings']:
            if dev.get('Ebs', None) is None:
                continue
            vol_name = dev['DeviceName'];
            vol_id = dev['Ebs']['VolumeId']

            for tag in instance['Tags']:
                if 'Name' in tag['Key']:
                    instance_name = tag['Value']
                    break
                else:
                    instance_name="NONAME"

            print "Found EBS volume %s on instance %s" % (
                vol_id, instance['InstanceId'])

            print "Creating snapshot for volume"

            snapshot = ec.create_snapshot(
                VolumeId=vol_id,
                Description='AutoSnap (' + datestamp + ') N:[' + instance_name + '] D:['+ vol_name +'] V:[' + vol_id + '] I:[' + instance['InstanceId'] + ']'
            )

            print "Tagging snapshot"
            ec.create_tags (
                Resources=[
                    snapshot['SnapshotId'],
                ],
                Tags=[
                    {
                        'Key': 'snapshotType',
                        'Value': 'autosnap'
                    },
                ]
            )

        print "Examining and removing old snapshots"
        response = ec.describe_snapshots(
         Filters=[
             {
                 'Name': 'tag:snapshotType',
                 'Values': [
                     'autosnap'
                 ]
             }
         ]
        )

        for snapshot in response['Snapshots']:
         preservation_date = datetime.datetime.now() + datetime.timedelta(-30)
         if snapshot['StartTime'].replace(tzinfo=None) < preservation_date:
             ec.delete_snapshot(
                 SnapshotId= snapshot['SnapshotId']
             )
