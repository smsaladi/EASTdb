
importScripts('https://cdn.jsdelivr.net/npm/workerpool@3.1.2/dist/workerpool.min.js')

// alignment from Sequence Manipulation Suite (Paul Stoddard)
// https://www.bioinformatics.org/sms2/pairwise_align_protein.html
importScripts(
  '/static/align/sms_common.js',
  '/static/align/align_pair_quad.js',
  '/static/align/align_pair_linear.js',
  '/static/align/pairwise_align_protein.js')


function pairwiseAlign(protA, protB) {
  // Essentially calls code from Sequence Manipulation Suite (Paul Stoddard)
  // License: GPLv2 or later (https://www.bioinformatics.org/sms2/mirror.html)
  
  // Set up scoring
	var scoreSet = new ScoreSet();
	scoreSet.setScoreSetParam(
    scoringMatrix=new Blosum62(), gapPenalty=0.5, beginGapPenalty=2, endGapPenalty=0.5);

	var alignment = new AlignPairLinear();
  alignment.setAlignParam(protA, protB, scoreSet);
  alignment.align();

  var alnA = alignment.getAlignedM();
  var alnB = alignment.getAlignedN();
  var score = alignment.score;

  return [alnA, alnB, score];
}

// create a worker and register public functions
workerpool.worker({
  pairwiseAlign: pairwiseAlign
});