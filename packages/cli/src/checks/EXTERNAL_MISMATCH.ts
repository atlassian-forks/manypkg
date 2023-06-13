import {
  makeCheck,
  getMostCommonRangeMap,
  getClosestAllowedRange,
  DEPENDENCY_TYPES
} from "./utils";
import { Package } from "@manypkg/get-packages";
import { validRange } from "semver";

type ErrorType = {
  type: "EXTERNAL_MISMATCH";
  workspace: Package;
  dependencyName: string;
  dependencyRange: string;
  expectedRange: string;
};

function isRangeMismatched(
  rangeStr: string,
  mostCommonRange: string | undefined,
  allowedVersions: string[] = [],
  isPeerDep: boolean = false
) {
  const notCommonRange = (range: string) =>
    mostCommonRange !== undefined && mostCommonRange !== range;

  const notAllowed = (range: string) => !allowedVersions.includes(range);

  if (!isPeerDep || !rangeStr.includes("||")) {
    return (
      notCommonRange(rangeStr) && notAllowed(rangeStr) && validRange(rangeStr)
    );
  }
  const peerDepRanges = rangeStr.split("||").map(r => r.trim());
  return peerDepRanges.some(r => notAllowed(r) && validRange(r));
}

function getExpectedRange(
  rangeStr: string,
  mostCommonRange: string | undefined,
  allowedVersions: string[] = []
) {
  if (allowedVersions.length === 0) {
    // In the case when there's no allowedVersions configured and no mostCommonRange for the
    // peer dep with multiple versions like `v1 || v2`, we fix it to the first version, v1.
    return mostCommonRange || rangeStr.split("||")[0].trim();
  }
  if (rangeStr.includes("||")) {
    return allowedVersions.join(" || ");
  }
  return getClosestAllowedRange(rangeStr, allowedVersions);
}

export default makeCheck<ErrorType>({
  validate: (workspace, allWorkspace, rootWorkspace, options) => {
    let errors: ErrorType[] = [];
    let mostCommonRangeMap = getMostCommonRangeMap(allWorkspace);
    for (let depType of DEPENDENCY_TYPES) {
      const isPeerDep = depType === "peerDependencies";
      let deps = workspace.packageJson[depType];

      if (deps) {
        for (let depName in deps) {
          let range = deps[depName];
          let mostCommonRange = mostCommonRangeMap.get(depName);
          const allowedVersions =
            options.allowedDependencyVersions &&
            options.allowedDependencyVersions[depName];
          if (
            isRangeMismatched(
              range,
              mostCommonRange,
              allowedVersions,
              isPeerDep
            )
          ) {
            errors.push({
              type: "EXTERNAL_MISMATCH",
              workspace,
              dependencyName: depName,
              dependencyRange: range,
              expectedRange: getExpectedRange(
                range,
                mostCommonRange!,
                allowedVersions
              )
            });
          }
        }
      }
    }
    return errors;
  },
  fix: error => {
    for (let depType of DEPENDENCY_TYPES) {
      let deps = error.workspace.packageJson[depType];
      if (deps && deps[error.dependencyName]) {
        deps[error.dependencyName] = error.expectedRange;
      }
    }
    return { requiresInstall: true };
  },
  print: error =>
    `${error.workspace.packageJson.name} has a dependency on ${error.dependencyName}@${error.dependencyRange} but the range should be set to ${error.expectedRange}`,
  type: "all"
});
