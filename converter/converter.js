const fs = require('fs');
const yaml = require('yaml');
const batcher = require('../commands/utils/batch/batcher.js'); 

function convertConfig(lt_config, outputFilePath) {
  return new Promise((resolve, reject) => {
    try {
      var obj = lt_config
      var he_yaml = {
        version: "0.1",
        globalTimeout: 90,
        testSuiteTimeout: 90,
        testSuiteStep: 90,
        runson: "${{ matrix.os }}",
        cypress: true,
        concurrency: 2,
        jobLabel: ["heJob"],
        pre: [],
        cacheKey: '{{ checksum "package.json" }}',
        cacheDirectories: ["node_modules", "cypressCache"],
        env: { CYPRESS_CACHE_FOLDER: "cypressCache" },
        matrix: { browser: [], test: [], os: new Set() },
        testSuites: [
          "npx cypress run --browser=$browser --headed --config video=false --spec $test",
        ],
        cypressOps: {
          DedicatedProxy: false,
          Build: "",
          BuildTags: [],
          Tags: [],
          Network: false,
          GeoLocation: "",
        },
        uploadArtefacts: [],
      };

      // add browsers,platform in yaml matrix
      for (let i = 0; i < obj.browsers.length; i++) {
        for (let j = 0; j < obj.browsers[i].versions.length; j++) {
          he_yaml.matrix.os.add(obj.browsers[i].platform);
          he_yaml.matrix.browser.push(
            obj.browsers[i].browser + "-" + obj.browsers[i].versions[j]
          );
        }
      }

      he_yaml.cypressOps.Build = obj.run_settings.build_name;
      he_yaml.cypressOps.Network = obj.run_settings.network;
      he_yaml.cypressOps.DedicatedProxy = obj.run_settings.dedicated_proxy;
      he_yaml.concurrency = obj.run_settings.parallels;

      if (obj.run_settings.downloads) {
        he_yaml.uploadArtefacts.push({
          name: "artefacts",
          path: obj.run_settings.downloads.split(","),
        });
      }

      for (let key in obj.run_settings.npm_dependencies) {
        he_yaml.pre.push(
          "npm install " + key + "@" + obj.run_settings.npm_dependencies[key]
        );
      }

      if (obj.run_settings.npm_dependencies === undefined) {
        he_yaml.pre.push("npm install");
      }

      if (obj.tunnel_settings !== undefined) {
        if (obj.tunnel_settings.tunnel !== undefined) {
          he_yaml.Tunnel = obj.tunnel_settings.tunnel;
        }
      }

      if (obj.run_settings.stop_on_failure !== undefined) {
        he_yaml.failFast = { maxNumberOfTests: 1 };
      }

      if (obj.run_settings.sys_envs !== undefined) {
        for (key in obj.run_settings.sys_envs) {
          he_yaml.env[key] = obj.run_settings.sys_envs[key];
        }
      }

      if (obj.run_settings.envs !== undefined) {
        for (key in obj.run_settings.envs) {
          he_yaml.env[key] = obj.run_settings.envs[key];
        }
      }

      if (obj.run_settings.geo_location !== undefined) {
        he_yaml.cypressOps.GeoLocation = obj.run_settings.geo_location;
      }

      if (obj.run_settings.ignore_files.length > 0) {
        fs.writeFileSync(".hyperexecuteignore", obj.run_settings.ignore_files.join("\n"));
      }

      if (obj.run_settings.useNodeVersion) {
        he_yaml.runtime = { language: "node", version: obj.run_settings.useNodeVersion };
      }

      if (obj.run_settings.max_duration) {
        he_yaml.globalTimeout = obj.run_settings.max_duration * 60;
      }

      if (obj.run_settings.reporter_config_file) {
        he_yaml.cypressOps.ReporterConfigFile = obj.run_settings.reporter_config_file;
      }

      if (obj.run_settings.cypress_settings) {
        he_yaml.testSuites[0] = he_yaml.testSuites[0] + " " + obj.run_settings.cypress_settings;
      }

      if (obj.run_settings.project_autocreate) {
        he_yaml.cypressOps.ProjectAutoCreate = obj.run_settings.project_autocreate;
      }

      if (obj.run_settings["project-name"]) {
        he_yaml.cypressOps.ProjectName = obj.run_settings["project-name"];
      }

      if (obj.run_settings.build_tags) {
        he_yaml.cypressOps.BuildTags = obj.run_settings.build_tags;
      }

      if (obj.run_settings.npm_via_tunnel) {
        he_yaml.tunnelOpts = { global: true };
      }

      if (obj.run_settings.cypress_version) {
        he_yaml.pre.push("npm install cypress@" + obj.run_settings.cypress_version);
      }

      if (obj.run_settings.npm_dependencies.length == 0 && !obj.run_settings.cypress_version) {
        he_yaml.pre.push("npm install");
      }

      batcher.get_spec_files(obj.run_settings.specs, obj.run_settings.exclude_specs).then(function (specs) {
        he_yaml.matrix.test = specs;
        fs.writeFileSync(outputFilePath, yaml.stringify(he_yaml));
        resolve();
      }).catch(reject);
    } catch (error) {
      fs.writeFileSync(outputFilePath, error.toString());
      resolve();
    }
  });
}

module.exports = convertConfig;

