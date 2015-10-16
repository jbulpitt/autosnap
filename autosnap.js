var AWS = require('aws-sdk'); 
var ec2 = new AWS.EC2(); 

exports.handler = function(event, context) {
  ec2.describeRegions(function(err, regions) {
    if (err) {
        console.log(err, err.stack);
    } else {
      for (var index in regions.Regions) {
          console.log( regions.Regions[index].RegionName );
          var ec2region = new AWS.EC2({region: regions.Regions[index].RegionName});

          ec2region.describeInstances(function(err, instances) {
            if (err) {
                console.log(err, err.stack);
            } else {
                for (var index in instances.Reservations) {
                    for (var indexi in instances.Reservations[index].Instances) {
                        console.log (instances.Reservations[index].Instances[indexi].InstanceId);
                        ec2region.describeVolumes({ Filters: [{ Name: 'attachment.instance-id', Values: [ instances.Reservations[index].Instances[indexi].InstanceId ]} ]}, function(err, volumes) {
                            if (err) {
                              console.log(err, err.stack); 
                            } else {
                              for (var indexv in volumes.Volumes) {
                                  var params = {
                                    VolumeId: volumes.Volumes[indexv].VolumeId,
                                    Description: 'Automatic AutoSnap Daily Snapshot'
                                  };
                                  ec2.createSnapshot(params, function(err, snapshot) {
                                    if (err) {
                                        console.log(err, err.stack);
                                    } else {
                                      console.log(snapshot);
                                      var params = {
                                        Resources: [
                                          snapshot.SnapshotId
                                        ],
                                        Tags: [ 
                                          {
                                            Key: 'snapshotType',
                                            Value: 'autosnap'
                                          }
                                        ]
                                      };
                                      ec2.createTags(params, function(err, data) {
                                        if (err) console.log(err, err.stack);
                                        else {
                                            var params = {
                                            Filters: [
                                              {
                                                Name: 'tag:snapshotType',
                                                Values: [
                                                  'autosnap'
                                                ]
                                              },
                                              {
                                                Name: 'volume-id',
                                                Values: [
                                                  volumes.Volumes[indexv].VolumeId
                                                ]
                                              }
                                            ]
                                          };
                                          ec2.describeSnapshots(params, function(err, snapshots) {
                                            if (err) console.log(err, err.stack);
                                            else {
                                                for (var indexs in snapshots.Snapshots) {
                                                    var preservationDate = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
                                                    if (snapshots.Snapshots[indexs].StartTime < preservationDate) {
                                                      var params = {
                                                        SnapshotId: snapshots.Snapshots[indexs].SnapshotId
                                                      };
                                                      ec2.deleteSnapshot(params, function(err, data) {
                                                        if (err) console.log(err, err.stack); 
                                                        else {
                                                            console.log("Deleteing Snapshot");
                                                        }
                                                      });
                                                    }
                                                }
                                            }
                                          });
                                        }
                                      }); 
                                    }
                                  });
                              }
                            }
                          });
                    } 
                }
            }
          });
      }
    }
  });
  //context.succeed();
};