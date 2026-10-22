// Android only. Two libraries bring in different versions of WorkManager:
// work-runtime 2.8.1 (react-native-android-widget) and work-runtime-ktx 2.7.1 (another dependency).
// Since 2.8 the -ktx classes live inside work-runtime, so the old -ktx copy duplicates them and the
// release build stops at checkReleaseDuplicateClasses. Pinning -ktx to 2.8.1 (an empty shim) fixes it.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARK = "// ossa: align androidx.work versions";

const GROOVY = `
${MARK}
configurations.all {
    resolutionStrategy.eachDependency { details ->
        if (details.requested.group == 'androidx.work' && details.requested.name == 'work-runtime-ktx') {
            details.useVersion '2.8.1'
        }
    }
}
`;

const KOTLIN = `
${MARK}
configurations.all {
    resolutionStrategy.eachDependency {
        if (requested.group == "androidx.work" && requested.name == "work-runtime-ktx") {
            useVersion("2.8.1")
        }
    }
}
`;

module.exports = function withAndroidWorkFix(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARK)) {
      cfg.modResults.contents += cfg.modResults.language === "kt" ? KOTLIN : GROOVY;
    }
    return cfg;
  });
};
