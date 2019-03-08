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

export default class DeployModule extends SfdxCommand {

  // This static variable sets the command description for help
  public static description = "Deploys a module in source-format from a sepcified location along with it's dependencies"; // messages.getMessage('pushCommandDescription');

  public static examples = [
    `sfdx gs:source:deploy:module -p config/module5.json -u MyScratchOrg
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
//against the -p param/flag one by one`
  ];

  // This static variable sets the flags/params for the commands along with
  // their description for the help
  protected static flagsConfig = {
    // flag with a value (-p, --dependenciesfile=config/module5.json)
    dependenciesfile: flags.string({char: 'p', required: true,
    description: `path to the dependency json file,
    to deploy a single module or directory, please use gs:source:deploy:dir command`}),
    onebyone: flags.boolean({char: 'o', required: false, default: false,
    description: `deploys packages one by one in their order of dependencies,
    if not passed deploys all of them as a single grouped and converted md package`}),
    packagelocation: flags.string({char: 'l', required: false,
    description: `path to store the mdapipackage, if not provided stores in the current directory,
    not applicable when opting for one by one deployment`}),
    validate: flags.boolean({char: 'c', required: false,
    description: 'validate only the push, not applicable when opting for one by one deployment'})
  };

  protected static supportsUsername = true;

  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {
    try {
      this.ux.log(emoji.emojify(':rocket:  Deploying................................... :rocket:'));
      // this.ux.startSpinner(chalk.bold.yellowBright('Saving'));
      // Reading the sfdx-project.json file based on the location provided as param
      const packageObj = await fs.readJSON(`${this.flags.dependenciesfile}`);
      if (this.flags.onebyone) {
        // Looping through based on dependencies and deploying each modules one by one to the target org
        for (const element of packageObj.packageDirectories) {
          this.ux.log(emoji.emojify(`:rocket:  Deploying ${element.path}................................... :rocket:`));
          console.log(`sfdx force:source:deploy -p ./${element.path}  --json --wait 20 --targetusername ${this.org.getUsername()}`);
          shellJS.exec(`sfdx force:source:deploy -p ./${element.path}  --json --wait 20 --targetusername ${this.org.getUsername()}`);
        }
      } else {
        fs.ensureDirSync('tempSFDXProject/tempModule/main/default');
        const srcPath = this.project.getPath();
        // Looping through and copying all the modules in single directory(sfdx format app aka module)
        for (const element of packageObj.packageDirectories) {
          // console.log(`Copying from ${srcPath}/${element.path}/main/default to tempSFDXProject/tempModule/main/default`);
          fs.copySync(`${srcPath}/${element.path}/main/default`, 'tempSFDXProject/tempModule/main/default');
        }

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
            // Delete the temporary SFDX project
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
      }

      // Return an object to be displayed with --json
      return { };
    } catch (excptn) {
      this.ux.error(`Something went wrong ${excptn}`);
      // Delete the temporary SFDX project
      shellJS.exec('rm -rf tempSFDXProject');
      return {excptn};
    }
  }
}
