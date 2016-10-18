import csv
import json

node_list = []
csv_nodes = open('job_tree_graph-nodes.csv','r')

for line in csv_nodes:
    line_list = line.strip('\n').split(',')
    if len(line_list) == 4 and line_list[1] and line_list[0] != 'id':
        new_dict = {'id':line_list[0], 'name':line_list[1], 'cl_centrality':line_list[2], 'modularity':line_list[3]}
        node_list.append(new_dict)

edge_list = []
csv_edges = open('job_tree_graph-edges.csv','r')
for line in csv_edges:
    line_list = line.strip('\n').split(',')
    if len(line_list) == 4 and line_list[0] != 'Source':
        new_dict = {'source':line_list[0], 'target':line_list[1], 'id':line_list[2], 'label':line_list[3]}
        edge_list.append(new_dict)

output_dict = { "nodes": node_list, "links": edge_list}

j = json.dumps(output_dict, indent=4)
f = open('public/job-tree.json', 'w')
print >> f, j
f.close()