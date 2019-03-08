import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import jsToXml = require('js2xmlparser');
import fs = require('fs-extra');
import shellJS = require('shelljs');
import emoji = require('node-emoji');

const path = require('path');

const options = {
  declaration: {
    include: true,
    encoding: 'UTF-8',
    version: '1.0'
  },
  format: {
    doubleQuotes: true
  }
};

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
// const messages = core.Messages.loadMessages('sfdx-selective-retrieve-deploy', 'pull');

const pkgDir = 'pkgDirTemp';

export default class Retrieve extends SfdxCommand {
  // This static variable sets the command description for help
  public static description = 'Retrieves specific metadata/s to a sepcified location'; // messages.getMessage('');

  public static examples = [
    `sfdx gs:source:retrieve --type ApexClass --names MyClass1,MyClass2 --targetdir app/main/default/classes
    // retrieves MyClass1 and MyClass2 from an org (sratch/non-scratch) to the provided directory location
    i.e app/main/default directory

    sfdx gs:source:retrieve --type Layout --names Layout1 --targetdir app/main/default --includedir
    // retrieves Layout1 along with the layouts folder from an org (sratch/non-scratch) to the provided directory
    location i.e app/main/default directory

    sfdx gs:source:retrieve --type PermissionSet --targetdir app/main/default --includedir
    // retrieves all the permission sets along with the PermissionSet folder from an org (sratch/non-scratch) to the provided directory
    location i.e. app/main/default directory
    `];

  // This static variale sets the flags/params for the commands along with
  // their description for the help
  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    names: flags.array({char: 'n', required: false, description: 'Name of the component/s to retrieve'}),
    type: flags.string({char: 't', required: true, description: 'Type of the components to retrieve, only support one component at a time'}),
    targetdir: flags.string({char: 'd', required: true, description: 'Path of target directory where the component needs to be pulled'}),
    includedir: flags.boolean({char: 'i', description: 'If you want to retrieve the directory as well along with the metadata components'}),
    // TODO: Create a separate command for retrieving components in metadata format.
    mdapiformat: flags.boolean({char: 'm', description: 'If you want to retrieve the content in mdapi format'})
  };

  // This static variable makes the org username required for the command
  protected static requiresUsername = true;

  public async run(): Promise<AnyJson> {
    // Setting some initial messages for the command when it runs
    const outputString = emoji.emojify(`Grabbing :truck:  metadata for you from :cloud:  with Id ${this.org.getOrgId()}. Meanwhile you can :eyes:  away from the :desktop_computer:  for 20 seconds!`);
    this.ux.log(outputString);
    this.ux.log(emoji.emojify(':rocket:  Working on it................................... :rocket:'));

    if (this.flags.type === 'CustomObject' || this.flags.type === 'CustomField' || this.flags.type === 'ListView'
        || this.flags.type === 'ValidationRule' || this.flags.type === 'RecordType') {

        fs.ensureDirSync('tempSFDXProject/tempModule/main/default');

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
                // Get rid of the temp sfdx project folder
                shellJS.exec('rm -rf tempSFDXProject');
                return err;
            }
            this.ux.log(emoji.emojify('Retrieval started.......'));
            // retrieve the component
            const output = shellJS.exec(`sfdx force:source:retrieve -m ${this.flags.type}:${this.flags.names} --targetusername ${this.org.getUsername()} --json`).stdout;
            const outputJSON = JSON.parse(output);
            const retrievedFilePath = outputJSON.result.inboundFiles[0].filePath;

            shellJS.cd('..');
            shellJS.exec('pwd');

            // copy the retrieved content to the target directory
            const fileName = path.basename(`tempSFDXProject/${retrievedFilePath}`);
            fs.copySync(`tempSFDXProject/${retrievedFilePath}`, `${this.flags.targetdir}/${fileName}`);

            // Get rid of the temp sfdx project folder
            shellJS.exec('rm -rf tempSFDXProject');
        });
        return  {};

    } else {
        // Creating the pckgDir directory which acts as temporary location
        // to retreive the package and perform necessary actions during the command run
        // fs.ensureDirSync(this.flags.targetdir);
        fs.ensureDirSync(pkgDir);

        const packageJSON = {
        '@': {
            xmlns: 'http://soap.sforce.com/2006/04/metadata'
        },
        types: [],
        version: await this.org.retrieveMaxApiVersion()
        };

        packageJSON.types.push({
          // If no name is passed, set it to * to pull all components of
          // the type passed as param
          members: this.flags.names ? this.flags.names : '*',
          name: this.flags.type
        });

        const packageXMl = jsToXml.parse('Package', packageJSON, options);
        this.ux.log(packageXMl);
        fs.writeFileSync(`./${pkgDir}/package.xml`, packageXMl);
        const output = shellJS.exec(`sfdx force:mdapi:retrieve -k ${pkgDir}/package.xml -r ./${pkgDir} -w 30 -u ${this.org.getUsername()} --json`);

        shellJS.exec(`unzip -qqo ./${pkgDir}/unpackaged.zip -d ./${pkgDir}`);
        shellJS.exec(`rm -rf ./${pkgDir}/unpackaged.zip`);
        shellJS.exec(`rm -rf ./${pkgDir}/unpackaged/package.xml`);

        // Get the list of all the folders inside the newly unzipped folder
        async function getDirectories(path) {
            const filesAndDirectories = await fs.readdir(path);
            let directories = [];

            await Promise.all(
                filesAndDirectories.map(name => {
                    return fs.stat(path + name)
                    .then(stat => {
                        if (stat.isDirectory()) {
                          directories.push(name);
                        }
                    });
                })
            );
            return directories;
        }

        // convert the name to source formatted name for all the files
        async function renameFiles(directory, inSourceFormat) {
            console.log('directory', directory);
            if (inSourceFormat) {
              let files = await fs.readdir(directory);

              files.forEach(file => {
                  console.log(file);
                  fs.rename(`${directory}/${file}`, `${directory}/${file}-meta.xml`, err => {
                    if ( err ) console.log('ERROR: ' + err);
                  });
              });
            }
        }

        let directories = await getDirectories(`${pkgDir}/unpackaged/`);

        await renameFiles(`${pkgDir}/unpackaged/${directories[0]}`, !this.flags.mdapiformat);

        // Copy over all the contents from one folder(first one, assuming there would always be one folder)
        // to the provided target directory
        const source = this.flags.includedir ? `${pkgDir}/unpackaged ` : `${pkgDir}/unpackaged/${directories[0]}`;
        fs.copy(source, `${this.flags.targetdir}`)
        .then(() => {
          shellJS.exec(`rm -rf ./${pkgDir}`);
        })
        .catch(err => {
          console.error(err);
        });
        // Return an object to be displayed with --json
        return { output };
    }
  }
}
