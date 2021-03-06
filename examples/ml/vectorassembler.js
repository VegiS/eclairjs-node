/*
 * Copyright 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function exit() {
  process.exit();
}

function stop(e) {
  if (e) {
    console.log(e);
  }
  sc.stop().then(exit).catch(exit);
}

var spark = require('../../lib/index.js');

function run(sc) {
  return new Promise(function(resolve, reject) {
    var sqlContext = new spark.sql.SQLContext(sc);


    var schema = spark.sql.types.DataTypes.createStructType([
      spark.sql.types.DataTypes.createStructField("id", spark.sql.types.DataTypes.IntegerType, false),
      spark.sql.types.DataTypes.createStructField("hour", spark.sql.types.DataTypes.IntegerType, false),
      spark.sql.types.DataTypes.createStructField("mobile", spark.sql.types.DataTypes.DoubleType, false),
      spark.sql.types.DataTypes.createStructField("userFeatures", new spark.mllib.linalg.VectorUDT(), false),
      spark.sql.types.DataTypes.createStructField("clicked", spark.sql.types.DataTypes.DoubleType, false)
    ]);
    var row = spark.sql.RowFactory.create([0, 18, 1.0, spark.mllib.linalg.Vectors.dense([0.0, 10.0, 0.5]), 1.0]);
    var rdd = sc.parallelize([row]);
    var dataset = sqlContext.createDataFrame(rdd, schema);

    var assembler = new spark.ml.feature.VectorAssembler()
      .setInputCols(["hour", "mobile", "userFeatures"])
      .setOutputCol("features");

    var output = assembler.transform(dataset);
    output.select("features", "clicked").first().mkString(",", "[", "]").then(resolve).catch(reject);


  });
}

if (global.SC) {
  // we are being run as part of a test
  module.exports = run;
} else {
  var sc = new spark.SparkContext("local[*]", "vectorassembler");
  run(sc).then(function(results) {
        console.log(JSON.stringify(results));
    stop();
  }).catch(stop);
}
