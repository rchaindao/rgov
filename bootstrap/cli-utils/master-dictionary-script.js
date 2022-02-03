/* eslint-disable */
const fs = require('fs');
const path = require('path');

const { deploy } = require('./deploy-script');
const { easyDeploy } = require('./easy-deploy-script');

const ALLNETWORKS = require('./networks-script');
const console = require('console');

const privatekey_f = path.join(__dirname, '../PrivateKeys/pk.bootstrap');
const network = 'localhost';

async function deploy_master_dictionary(dictionary_contract_URI) {
   const rholang =
   `
   match [ \`${dictionary_contract_URI}\`] {
      [dict_uri] => { new result, deployerId(\`rho:rchain:deployerId\`), stdout(\`rho:io:stdout\`), insertArbitrary(\`rho:registry:insertArbitrary\`), lookup(\`rho:registry:lookup\`), lookCh, ret in {
         lookup!(dict_uri, *lookCh) |
         for (Dir <- lookCh) {
            Dir!(*ret) |
            for (@{"read": read, "write": write, "grant": grant} <- ret) {
               // Create global reference to dictionary using the private key
               @[*deployerId, "MasterDictionary"]!({"read": read, "write": write, "grant": grant}) |
               // Create a URI for the read capability to the dictionary
               insertArbitrary!(read, *ret) |
               for ( uri <- ret) {
                  stdout!({"MasterReadURI": *uri}) |
                  result!({"MasterReadURI": *uri})
               }
            }
         }
      }
   }
}
   `

   // output rholang to generated file generated/generated.create-master-directory.rho
   const dir = path.join(__dirname, '/generated');

   if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true});
    }

   const output_f = path.join(__dirname, '/generated/generated.create-master-directory.rho');

   fs.writeFileSync(output_f, rholang, function (err) {
      if (err) {
         console.log(err);
      }
      console.log('generated');
   });

   const result = await easyDeploy(console, ALLNETWORKS, output_f, privatekey_f, network);
   return result;
}

function update_master_dictionary(entry_name, URI) {
   const rholang =
   `
   match [ \`${URI}\` ] {
      [ URI ] => new deployerId(\`rho:rchain:deployerId\`, stdout(\`rho:io:stdout\`), lookup(\`rho:registry:lookup\`), lookCh, ret in {
         for (@{"write": write, ..._} <<- @[*deployerId, "MasterContractAdmin"]) {
            // insert ${entry_name}
            lookup!(URI, *lookCh) |
            for (C <- lookCh) {
               stdout!(["writing to master dictionary: ${entry_name} ", URI, *C]) |
               @write!("${entry_name}", *C, *ret) |
               for (@x <- ret) {
                  stdout!(x)
               }
            }
         }
      }
   `

   // output rholang to generated file generated/generated.${entry_name}.rho
   const output_f = path.join(__dirname, 'generated/generated.' + entry_name + '.rho');
   fs.writeFileSync(output_f, rholang);

   const result = easyDeploy(console, ALLNETWORKS, output_f, privatekey_f, network);

   return result;
}

module.exports = {
   deploy_master_dictionary,
   update_master_dictionary
}