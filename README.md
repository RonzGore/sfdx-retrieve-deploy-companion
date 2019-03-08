@rohanatgwcs/sfdx-selective-retrieve-deploy
===========================================

SFDX plugin to selectively retrieve metadata of a particular type from an org to a specified directory in source format and to deploy a particular module, directory or a component in source format to an org. Both source tracked and non source tracked orgs are supported.

[![Version](https://img.shields.io/npm/v/@rohanatgwcs/sfdx-selective-retrieve-deploy.svg)](https://npmjs.org/package/@rohanatgwcs/sfdx-selective-retrieve-deploy)
[![Downloads/week](https://img.shields.io/npm/dw/@rohanatgwcs/sfdx-selective-retrieve-deploy.svg)](https://npmjs.org/package/@rohanatgwcs/sfdx-selective-retrieve-deploy)
[![License](https://img.shields.io/npm/l/@rohanatgwcs/sfdx-selective-retrieve-deploy.svg)](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/master/package.json)


## How to install
```
$ sfdx plugins:install @rohanatgwcs/sfdx-selective-retrieve-deploy

```

### `sfdx gs:source:retrieve`

Retrieves specific metadata/s to a sepcified location based on name and type  
or all the meatadata of a specific type from any org

```
USAGE
  $ sfdx gs:source:retrieve

OPTIONS
  -d, --targetdir=targetdir                       (required) Path of target directory where the component needs to be pulled
  -i, --includedir                                If you want to retrieve the directory as well along with the metadata components
  -m, --mdapiformat                               If you want to retrieve the content in mdapi format
  -n, --names=names                               Name of the component/s to retrieve
  -t, --type=type                                 (required) Type of the components to retrieve, only support one component at a time
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation  

EXAMPLES
  sfdx gs:source:retrieve --type ApexClass --names MyClass1,MyClass2 --targetdir app/main/default/classes
  // retrieves MyClass1 and MyClass2 from an org (sratch/non-scratch) to the provided directory location
  i.e app/main/default directory

  sfdx gs:source:retrieve --type Layout --names Layout1 --targetdir app/main/default --includedir
  // retrieves Layout1 along with the layouts folder from an org (sratch/non-scratch) to the provided directory location i.e app/main/default directory

  sfdx gs:source:retrieve --type PermissionSet --targetdir app/main/default --includedir
  // retrieves all the permission sets along with the PermissionSet folder from an org (sratch/non-scratch) to the provided directory location i.e. app/main/default directory

METADATA TYPES THAT CAN BE PASSED AS AN ARGUMENT AGAINST THE NAME PARAMETER
  'AccountCriteriaBasedSharingRule', 'AccountOwnerSharingRule', 'AnalyticSnapshot', 'ApexClass',
  'ApexComponent', 'ApexPage', 'ApexTrigger', 'ApprovalProcess', 'AppMenu', 'AssignmentRules',
  'AuraDefinitionBundle', 'AuthProvider', 'AutoResponseRules', 'Certificate', 'CleanDataService',
  'Community', 'CompactLayout', 'CustomApplication', 'CustomApplicationComponent', 'CustomField',
  'CustomLabels', 'CustomObject', 'CustomMetadata', 'CustomObjectTranslation', 'CustomPageWebLink',
  'CustomPermission', 'CustomSite', 'CustomTab', 'DelegateGroup', 'DuplicateRule', 'EscalationRules',
  'ExternalDataSource', 'FlexiPage', 'Flow', 'FlowDefinition', 'GlobalValueSet',
  'GlobalValueSetTranslation', 'Group', 'HomePageComponent', 'HomePageLayout', 'Layout', 'Letterhead', 'ListView', 'ManagedTopics', 'MatchingRule', 'MatchingRules', 'Network',
  'PathAssistant', 'PermissionSet', 'Profile', 'Queue', 'QuickAction', 'RecordType', 'RemoteSiteSetting', 'ReportType', 'Role', 'SharingRules', 'SharingCriteriaRule',
  'SharingOwnerRule', 'SharingTerritoryRule', 'SiteDotCom', 'StandardValueSet',
  'StandardValueSetTranslation', 'StaticResource', 'Territory', 'Translations', 'ValidationRule',
  'WebLink', 'Workflow', 'WorkflowAlert', 'WorkflowFieldUpdate', 'WorkflowRule', 'Settings',
  'WaveApplication', 'WaveDashboard', 'WaveDataflow', 'WaveLens', 'WaveTemplateBundle', 'Wavexmd',
  'WaveDataset'`

```

_See code: [src/commands/gs/source/retrieve.ts](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/master/src/commands/gs/source/retrieve.ts)_

### `sfdx gs:source:deploy:module`

Deploys a module in source-format along with it's dependencies based on a dependency json file to any org

```
USAGE
  $ sfdx gs:source:deploy:module

OPTIONS
  -c, --validate                                  validate only the push
  -p, --dependenciesfile=dependenciesfile         path to the dependency json file
  -o, --onebyone=onebyone                         deploys packages one by one in their order of dependencies,if not passed deploys all of them as a single grouped and converted md package
  -l, --packagelocation=packagelocation           path to store the mdapipackage, if not provided stores in the current directory,not applicable when opting for one by one deployment
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation  


EXAMPLE
  sfdx gs:source:deploy:module -p config/module5.json -u MyScratchOrg
  //deploys a module to a target org (both scratch and non-scratch works) having alias MyScratchOrg
  //with all it's dependecies(modules) defined in the json file passed
  //against the -p param/flag as a single mdapi package and stores the generated mdapi
  //package in the sfdx project's root

  sfdx gs:source:deploy:module --dependenciesfile config/module5.json -u MyScratchOrg --validate
  //validates the deplpoyment of a module to a target org
  //(both scratch and non-scratch works) having alias MyScratchOrg
  //with all it's dependecies(modules) defined in the json file passed
  //against the -p param/flag as a single mdapi package and stores the generated mdapi
  //package in the sfdx project's root

  sfdx gs:source:deploy:module -p config/module5.json -u MyScratchOrg --packagelocation ./mdpackages
  //deploys a module to a target org (both scratch and non-scratch works) having alias MyScratchOrg
  //with all it's dependecies(modules) defined in the json file passed
  //against the -p param/flag as a single mdapi package and stores the generated mdapi
  //package in the 'mdpackages' directory

  sfdx gs:source:deploy:module -p config/module5.json -u MyScratchOrg --onebyone
  //deploys a module to a a target org (both scratch and non-scratch works) having alias MyScratchOrg
  //with all it's dependecies(modules) defined in the json file passed
  //against the -p param/flag one by one

```

_See code: [src/commands/gs/source/deploy/module.ts](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/master/src/commands/gs/source/deploy/module.ts)_

### `sfdx gs:source:deploy:dir`

Deploys a directory or a single module in source-format to any org

```
USAGE
  $ sfdx gs:source:deploy:dir

OPTIONS
  -c, --validate                                  validate only the push
  -d, --directorypath=directorypath               path of the directory to be pushed
  -l, --packagelocation=packagelocation           path to store the mdapipackage, if not provided stores in the current directory,not applicable when opting for one by one deployment
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  sfdx gs:source:deploy:dir --directorypath app
  //deploys app module to the default target org(if any)

  sfdx gs:source:deploy:dir -d app/main/default/PermissionSets -c -u MyTargetOrg
  //validates the deployment of all the permission sets from the directory myFolder/PermissionSets on MyTargetOrg

```
_See code: [src/commands/gs/source/deploy/dir.ts](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/master/src/commands/gs/source/deploy/dir.ts)_

### `sfdx gs:source:deploy:cmp`

Deploys a component in source-format to any org

```
USAGE
  $ sfdx gs:source:deploy:cmp

OPTIONS
  -c, --validate                                  validate only the push
  -d, --path=path                                 path of the component in source format to be pushed
  -l, --packagelocation=packagelocation           path to store the mdapipackage, if not provided stores in the current directory,not applicable when opting for one by one deployment
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  sfdx gs:source:deploy:cmp --path app/main/default/permissionsets/MyPermissionSet -u MyTargerOrg
  //deploys the MyPermissionSet to an org with alias MyTargetOrg

  sfdx gs:source:deploy:cmp -p app/main/default/permissionsets/MyClass --validate
  //validates the deployment of MyClass to a default target org deployment of all the permission sets from the directory myFolder/PermissionSets on MyTargetOrg
  
```
_See code: [src/commands/gs/source/deploy/cmp.ts](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/master/src/commands/gs/source/deploy/cmp.ts)_

## Motivation behind this plugin:
``` 
1. sfdx gs:source:retrieve
Selectively retrieve a specific type of metadata to a directory of your choice. The sfdx force:source:pull command does not give you flexibility regarding what you want to retrieve and where while sfdx force:source:retrieve does give
you an option what to rtrieve selectively but not to a specific folder or directory of your choice.
Use cases:
a. You are working in a multi-module sfdx project and retrieve a specific metadata to your module/folder of choice without messing around with the sfdx-project.json and .forceignore files.
b. You created/changed some components in the scratch org, but do not want to retrieve all of them into your local sfdx project's directory/module of choice.
c. You changed the name of a field, and this field is being referenced in a layout and a record type. There is no way sfdx force:source:pull retrieves layout and record type for you. This plugin comes in handy then.
d. Retrieve the changed community binary file after every change in the community, sfdx force:source:pull does not seems to support it. Retrieve any files that are not supported for source tracking at the moment but are suppported by
mdapi.

Known Limitations: The target directory is a mandatory parameter, support for a default directory based on sfdx-package.json would be helpful. I will wait for feedback before starting to work on this.

2. sfdx gs:source:deploy family of commands
Deploy the module of your choice to the scratch org. Unlike sfdx force:sorce:pull, this command does not rely on the changes you made to be pushed to the repo, instead explicitly tries to deploy the folder/module to your scratch org. 
Use Cases: 
a. sfdx force:source:push can bring your org into indeed an inconsistent state due to its default and non-controllable way of selectively deploying components(partially succeeded deployments). This command comes in handy in such situations to bring your org to the right state.
b. If you are working on a multi-module approach and do not want to deploy all the modules to the org and at the same time also do not wish to play around with sfdx-project.json and .forceignore file, this command can be at your rescue.

Note: Both these commands work equally well with sandboxes and scratch orgs as long as you have authenticated the target org with SFDX CLI. So if you are using them in non-scratch orgs, use them with utmost care as they are powerful and can alter/override the things in any target environment.

```

## Change Log

```
### Version 1.2.0  
1. Support for type based retrieval of components  
sfdx gs:source:pull --type PermissionSet --targetdir app/main/default --includedir  

2. Support for retrieval of components in the -meta.xml format by default, earlier it  
used to be mdapi format .xml by default. MDAPI format can still be retrived/pulled by
passing the --mdapiformat(-m) format.

### Version 1.2.1
1. Support for file and folder push/deploy which are not in source format  
2. Support for validating push/deploy

### Version 1.2.2
Minor fixes: removal of logs and temp folders.

### Version 1.3.0
Support for json based simple dependency management
e.g. sfdx gs:source:push -m force-app -i -u MyScratchOrg -p config/dependencies.json
A typical dependency.json file will look like
{
    "packageDirectories": [
      {
        "path": "data-model"
      },
      {
        "path": "log-lib"
      },
      {
        "path": "force-app"
      }
}

This means force-app is dependant on data-model and log-lib modules.

### Version 1.4.0
1. Support for copying the mdpaiPackage generated as part of the push process to a specified location passed as a param/flag otherwise to the root of the project folder.
2. Enhancements to the dependency management, no need to pass the module name
e.g. sfdx gs:source:push -u MyScratchOrg -p config/dependencies.json

### Version 2.0.0
Plugin overhaul. A completely new set of commands:
1. __gs:source:push__ is broken dowm and enhanced to __gs:source:deploy:module__, __gs:source:deploy:dir__ and __gs:source:deploy:cmp__ commands. 
2. __gs:source:pull becomes __gs:source:retrieve__.
Read more about them in their respective help sections above. push and pull seems to be confusing as
these commands do not take care of any source tracking and thus the name push and pull were not doing any justice.

```
