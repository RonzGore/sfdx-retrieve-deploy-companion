import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import emoji = require('node-emoji');
import fs =  require('fs-extra');
import shellJS =  require('shelljs');

const path = require('path');

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
// const messages = core.Messages.loadMessages('sfdx-selective-retrieve-deploy', 'push');

export default class DeployComponent extends SfdxCommand {

  // This static variable sets the command description for help
  public static description = 'Deploys a particular component in source-format from a specified location'; // messages.getMessage('pushCommandDescription');

  public static examples = [
    `sfdx gs:source:deploy:cmp --path app/main/default/permissionsets/MyPermissionSet -u MyTargerOrg
//deploys the MyPermissionSet to an org with alias MyTargetOrg

sfdx gs:source:deploy:cmp -p app/main/default/permissionsets/MyClass --validate
//validates the deployment of MyClass to a default target org`
  ];

  // This static variable sets the flags/params for the commands along with
  // their description for the help
  protected static flagsConfig = {
    // flag with a value (-f, --path=app/main/default/classes/MyClass)
    path: flags.string({char: 'p', required: false,
    description: 'path of the component in source format to be pushed'}),
    validate: flags.boolean({char: 'c', required: false,
    description: 'validate only the push'}),
    packagelocation: flags.string({char: 'l', required: false,
    description: 'path to store the mdapipackage, if not provided stores in the current directory'})
  };

  protected static supportsUsername = true;

  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    try {
        this.ux.log(emoji.emojify(':rocket:  Working on it................................... :rocket:'));

        fs.ensureDirSync('tempSFDXProject/tempModule/main/default');

        fs.copySync(`${this.flags.path}`, `tempSFDXProject/tempModule/${this.flags.path}`);

        const validateOnly = this.flags.validate ? '-c' : '';

        // Change the working directory to a temporary SFDX project
        shellJS.cd('tempSFDXProject');

        // Create and write the sfdx-project.json to tempSFDXProject
        // to give it the sfdx nature so that sfdx force:source:convert
        // can work
        fs.writeJson('sfdx-project.json', {
        packageDirectories: [{
            path: 'tempModule',
            default: true}],
        namespace: '',
        sfdcLoginUrl: 'https://login.salesforce.com',
        sourceApiVersion: await this.org.retrieveMaxApiVersion()}, err => {
            if (err) {
                this.ux.error(`Something went wrong ${err}`);
                shellJS.exec('rm -rf tempSFDXProject');
                return err;
            }
            this.ux.log(emoji.emojify(':arrow_forward: Deployment started.......'));
            // Convert the source
            const output = shellJS.exec('sfdx force:source:convert --json', {silent: true}).stdout;
            const outputJSON = JSON.parse(output);
            const mdapiPackageLocation = outputJSON.result.location;
            const mdapiPackageName = path.basename(mdapiPackageLocation);
            // Deploy
            shellJS.exec(`sfdx force:mdapi:deploy --deploydir ${mdapiPackageName} ${validateOnly} --targetusername ${this.org.getUsername()} --wait 20`);
            // Switch to the parent direcroty
            shellJS.cd('..');
            // Copying the mdapi package (artifact)
            if (this.flags.packagelocation) {
                fs.copySync(`${mdapiPackageLocation}`, `${this.flags.packagelocation}/${mdapiPackageName}`);
            } else {
                fs.copySync(`${mdapiPackageLocation}`, `${this.project.getPath()}/${mdapiPackageName}`);
            }
            // Delete the temporary SFDX project
            shellJS.exec('rm -rf tempSFDXProject');
        });
        // Return an object to be displayed with --json
        return { };
    } catch (exptn) {
        this.ux.error(`Something went wrong ${exptn}`);
        shellJS.exec('rm -rf tempSFDXProject');
        return {exptn};
    }
  }
}
